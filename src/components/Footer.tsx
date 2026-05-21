import Image from 'next/image'

const footerLinks = [
  { label: 'System', href: '#system' },
  { label: 'Experience', href: '#experience' },
  { label: 'Compositions', href: '#compositions' },
  { label: 'Enter', href: '#enter' },
]

export default function Footer() {
  return (
    <footer className="relative border-t border-white/[0.05] bg-black">
      {/* Top section */}
      <div className="max-w-screen-xl mx-auto px-6 md:px-12 pt-16 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-14">
          {/* Brand */}
          <div>
            <a href="#hero" className="inline-flex items-center gap-3 mb-5">
              <Image
                src="/logo.jpg"
                alt="3love"
                width={40}
                height={40}
                className="object-contain"
              />
              <span className="font-syne font-bold text-white text-[11px] tracking-[0.3em] uppercase">
                3love
              </span>
            </a>
            <p className="font-inter text-white/25 text-sm leading-relaxed">
              3 Versions of Love.<br />
              A system. Not a brand.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <p className="section-label mb-5">Navigate</p>
            <ul className="space-y-3">
              {footerLinks.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    className="font-inter text-sm text-white/30 hover:text-white/70 transition-colors duration-300"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="section-label mb-5">Connect</p>
            <div className="space-y-3">
              <a
                href="mailto:hello@3love.in"
                className="block font-inter text-sm text-white/30 hover:text-white/70 transition-colors duration-300"
              >
                hello@3love.in
              </a>
              <a
                href="#"
                className="block font-inter text-sm text-white/30 hover:text-white/70 transition-colors duration-300"
              >
                Instagram
              </a>
              <p className="font-syne text-[10px] tracking-[0.2em] uppercase text-purple-primary/50 mt-4">
                3V–L0V3 · 3VOL–V3
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/[0.05] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-inter text-[11px] text-white/20">
            © 2026 3 Versions of Love. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <span className="sparkle" style={{ width: 6, height: 6, opacity: 0.4 }} />
            <p className="font-syne text-[10px] tracking-[0.3em] uppercase text-white/20">
              Memory Constants
            </p>
            <span className="sparkle" style={{ width: 6, height: 6, opacity: 0.4 }} />
          </div>
          <div className="flex items-center gap-5">
            <a href="#" className="font-inter text-[11px] text-white/20 hover:text-white/40 transition-colors">
              Privacy
            </a>
            <a href="#" className="font-inter text-[11px] text-white/20 hover:text-white/40 transition-colors">
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
