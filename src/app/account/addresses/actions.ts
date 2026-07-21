'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { ObjectId } from 'mongodb'
import { z } from 'zod'
import { requireCustomer } from '@/lib/backend/auth'
import { collections } from '@/lib/backend/db'

function readField(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

const addressSchema = z.object({
  label: z.string().max(40),
  fullName: z.string().min(2).max(120),
  line1: z.string().min(2).max(160),
  line2: z.string().max(160),
  city: z.string().min(2).max(100),
  county: z.string().max(100),
  postcode: z.string().min(5).max(10).regex(/^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i),
  phone: z.string().max(30),
})

export async function createAddress(formData: FormData) {
  const user = await requireCustomer('/account/addresses')
  const db = await collections()
  const userId = user.id
  const parsed = addressSchema.safeParse({
    label: readField(formData, 'label'),
    fullName: readField(formData, 'fullName'),
    line1: readField(formData, 'line1'),
    line2: readField(formData, 'line2'),
    city: readField(formData, 'city'),
    county: readField(formData, 'county'),
    postcode: readField(formData, 'postcode').toUpperCase(),
    phone: readField(formData, 'phone'),
  })
  if (!parsed.success) redirect('/account/addresses?result=invalid')

  const makeDefault = formData.get('isDefault') === 'on' || await db.addresses.countDocuments({ userId }) === 0

  if (makeDefault) {
    await db.addresses.updateMany({ userId }, { $set: { isDefault: false, updatedAt: new Date() } })
  }

  const now = new Date()
  await db.addresses.insertOne({
    userId,
    label: parsed.data.label || null,
    fullName: parsed.data.fullName,
    line1: parsed.data.line1,
    line2: parsed.data.line2 || null,
    city: parsed.data.city,
    county: parsed.data.county || null,
    postcode: parsed.data.postcode,
    countryCode: 'GB',
    phone: parsed.data.phone || null,
    isDefault: makeDefault,
    createdAt: now,
    updatedAt: now,
  })

  revalidatePath('/account/addresses')
  redirect('/account/addresses?result=saved')
}

export async function deleteAddress(formData: FormData) {
  const user = await requireCustomer('/account/addresses')
  const id = readField(formData, 'id')
  if (!id || !ObjectId.isValid(id)) return

  const db = await collections()
  const userId = user.id
  const deleted = await db.addresses.findOneAndDelete({ _id: new ObjectId(id), userId })
  if (deleted?.isDefault) {
    const replacement = await db.addresses.find({ userId }).sort({ createdAt: -1 }).limit(1).next()
    if (replacement?._id) {
      await db.addresses.updateOne({ _id: replacement._id, userId }, { $set: { isDefault: true, updatedAt: new Date() } })
    }
  }

  revalidatePath('/account/addresses')
  redirect('/account/addresses?result=removed')
}
