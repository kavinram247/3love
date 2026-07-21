import Link from 'next/link'
import { requireAdmin } from '@/lib/backend/auth'
import { getAdminCatalog } from '@/lib/backend/catalog'
import { isClerkConfigured, isMongoConfigured } from '@/lib/backend/env'
import { formatGbp } from '@/lib/backend/format'
import { productStatuses } from '@/lib/backend/types'
import { createProduct, updateProduct } from './actions'

export const dynamic = 'force-dynamic'

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<{ result?: string }> }) {
  if (!isMongoConfigured() || !isClerkConfigured()) {
    return (
      <main id="main-content" className="commerce-shell">
        <section className="commerce-panel">
          <p className="micro-label">3LOVE / PRODUCTS</p>
          <h1>Catalog unavailable</h1>
          <p>Connect MongoDB and Clerk to manage products.</p>
        </section>
      </main>
    )
  }

  await requireAdmin('/admin/products')
  const { result } = await searchParams
  const products = await getAdminCatalog()

  return (
    <main id="main-content" className="commerce-shell">
      <section className="commerce-panel">
        <p className="micro-label">3LOVE / CATALOG</p>
        <h1>Products</h1>
        {result && (
          <p className={`commerce-message ${['created', 'updated'].includes(result) ? 'is-success' : ''}`} role="status">
            {result === 'created' && 'Product created.'}
            {result === 'updated' && 'Product updated.'}
            {result === 'invalid' && 'Check names, price, stock, accent RGB, and optional Stripe Price ID.'}
            {result === 'duplicate' && 'A product already uses that slug or SKU.'}
            {result === 'stock-conflict' && 'Stock cannot be lower than the quantity currently reserved for checkout.'}
          </p>
        )}
        <div className="commerce-list">
          {products.map((product) => {
            const variant = product.variants[0]
            if (!variant) return null

            return (
              <form key={product._id.toHexString()} className="commerce-row admin-product-row" action={updateProduct}>
                <input type="hidden" name="productId" value={product._id.toHexString()} />
                <input type="hidden" name="variantId" value={variant.id} />
                <div className="admin-form-grid">
                  <label><span>Name</span><input name="name" defaultValue={product.name} required /></label>
                  <label><span>Concept</span><input name="concept" defaultValue={product.concept} required /></label>
                  <label><span>Phase</span><input name="phase" defaultValue={product.phase} required /></label>
                  <label><span>Quote</span><input name="quote" defaultValue={product.quote} required /></label>
                  <label><span>Notes</span><textarea name="notes" defaultValue={product.notes.join(', ')} rows={2} /></label>
                  <label><span>Description</span><textarea name="description" defaultValue={product.description ?? ''} rows={2} /></label>
                  <label><span>Image</span><input name="imageSrc" defaultValue={product.imageSrc} required /></label>
                  <label><span>Scene</span><input name="sceneSrc" defaultValue={product.sceneSrc} required /></label>
                  <label><span>Accent RGB</span><input name="accent" defaultValue={product.accent} required /></label>
                  <label><span>Sort</span><input name="sortOrder" type="number" defaultValue={product.sortOrder} /></label>
                  <label>
                    <span>Status</span>
                    <select name="status" defaultValue={product.status}>
                      {productStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                  </label>
                  <label><span>SKU</span><input value={variant.sku} readOnly /></label>
                  <label><span>Variant</span><input name="variantName" defaultValue={variant.name} required /></label>
                  <label><span>Volume</span><input name="volume" defaultValue={variant.volume} required /></label>
                  <label><span>Price GBP</span><input name="priceGbp" defaultValue={(variant.priceGbpPence / 100).toFixed(2)} required /></label>
                  <label><span>Stripe Price ID</span><input name="stripePriceId" defaultValue={variant.stripePriceId ?? ''} /></label>
                  <label><span>Stock</span><input name="stockOnHand" type="number" defaultValue={variant.stockOnHand} /></label>
                  <label className="commerce-checkbox"><input name="isFeatured" type="checkbox" defaultChecked={product.isFeatured} /><span>Featured</span></label>
                  <label className="commerce-checkbox"><input name="variantActive" type="checkbox" defaultChecked={variant.isActive} /><span>Variant active</span></label>
                </div>
                <div className="commerce-row-actions">
                  <strong>{formatGbp(variant.priceGbpPence)}</strong>
                  <em>{Math.max(variant.stockOnHand - variant.stockReserved, 0)} available</em>
                  <button type="submit">Save</button>
                </div>
              </form>
            )
          })}
        </div>
      </section>

      <section className="commerce-panel">
        <p className="micro-label">NEW PRODUCT</p>
        <h2>Create catalog item</h2>
        <form className="commerce-form admin-form-grid" action={createProduct}>
          <label><span>Slug</span><input name="slug" required /></label>
          <label><span>Name</span><input name="name" required /></label>
          <label><span>Concept</span><input name="concept" required /></label>
          <label><span>Phase</span><input name="phase" required /></label>
          <label><span>Quote</span><input name="quote" required /></label>
          <label><span>Notes</span><textarea name="notes" rows={2} /></label>
          <label><span>Description</span><textarea name="description" rows={2} /></label>
          <label><span>Image</span><input name="imageSrc" /></label>
          <label><span>Scene</span><input name="sceneSrc" /></label>
          <label><span>Accent RGB</span><input name="accent" placeholder="176 122 255" /></label>
          <label><span>Sort</span><input name="sortOrder" type="number" defaultValue={0} /></label>
          <label><span>Status</span><select name="status" defaultValue="DRAFT"><option value="DRAFT">DRAFT</option><option value="ACTIVE">ACTIVE</option></select></label>
          <label><span>SKU</span><input name="sku" required /></label>
          <label><span>Variant</span><input name="variantName" defaultValue="50ML" /></label>
          <label><span>Volume</span><input name="volume" defaultValue="50ML" /></label>
          <label><span>Price GBP</span><input name="priceGbp" defaultValue="120.00" /></label>
          <label><span>Stripe Price ID</span><input name="stripePriceId" /></label>
          <label><span>Stock</span><input name="stockOnHand" type="number" defaultValue={100} /></label>
          <label className="commerce-checkbox"><input name="isFeatured" type="checkbox" /><span>Featured</span></label>
          <button className="cinema-button" type="submit"><span>Create product</span><i>↗</i></button>
        </form>
        <div className="commerce-actions">
          <Link className="quiet-link" href="/admin">Back to admin</Link>
        </div>
      </section>
    </main>
  )
}
