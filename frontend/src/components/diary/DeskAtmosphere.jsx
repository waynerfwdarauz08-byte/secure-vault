/** Decorative scenery only: no events, timers, network requests or private data. */
export default function DeskAtmosphere() {
  return <div className="desk-atmosphere" aria-hidden="true">
    <div className="ambient-light ambient-light-primary" />
    <div className="ambient-light ambient-light-secondary" />
    <div className="window-light"><span /><span /><span /></div>
    <svg className="botanical-shadow" viewBox="0 0 300 540" fill="none">
      <path d="M40 530C83 431 75 318 160 221C210 162 202 87 263 15" stroke="currentColor" strokeWidth="5" />
      <path d="M77 433C-9 418 0 360 8 337C70 341 98 378 77 433ZM94 366C180 357 202 308 202 277C142 284 105 313 94 366ZM122 277C45 248 52 196 62 174C111 187 139 226 122 277ZM163 218C235 224 269 180 276 149C219 143 176 175 163 218ZM200 139C134 106 150 68 164 48C206 67 219 101 200 139ZM228 76C280 83 300 46 297 18C252 18 233 43 228 76Z" fill="currentColor" />
    </svg>
    <div className="floating-dust">{Array.from({ length: 12 }, (_, index) => <i key={index} />)}</div>
    <div className="desk-vignette" />
  </div>;
}
