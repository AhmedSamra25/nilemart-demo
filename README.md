# NileMart — demo storefront

A static, bilingual storefront for **NileMart**, a fictional Egyptian online hypermarket.
It exists to host a Tactful AI chat widget in something that looks and behaves like a real
grocery site, so the assistant can be demoed against a working catalogue.

Plain HTML, CSS and vanilla JavaScript. No build step, no bundler, no `npm install`, no
backend. Drag the folder onto Netlify Drop and it works.

Every product, price, offer, branch, FAQ answer and policy line on this site comes from
`../NileMart-KB/`. Nothing is invented — see **What the knowledge base does not cover**
at the end for the gaps that were left as gaps.

---

## Preview it locally

The pages fetch JSON, so they need a web server — opening `index.html` by double-clicking
will show a "page data did not load" message instead of the site.

```bash
cd nilemart-site && python3 -m http.server 8000
```

Then open <http://localhost:8000>. Any static server works (`npx serve`, `php -S`, VS Code
Live Server).

---

## Deploy it

The folder is deploy-ready as-is. Nothing needs compiling.

**Netlify Drop** — go to <https://app.netlify.com/drop> and drag the `nilemart-site` folder
onto the page. You get a URL in a few seconds. Drag it again to update.

**GitHub Pages** — push the contents of `nilemart-site/` to a repository, then in
*Settings → Pages* set the source to the branch and folder holding these files. If you
push the whole project rather than just this folder, set the folder to `/nilemart-site`.
Paths are all relative, so it works from a sub-path like `username.github.io/repo/`.

**Cloudflare Pages** — *Create a project → Connect to Git*, then set:

| Setting | Value |
|---|---|
| Framework preset | None |
| Build command | *(leave empty)* |
| Build output directory | `nilemart-site` |

Or use *Direct Upload* and drop the folder in.

**Anything else** — S3, Azure Static Web Apps, nginx, a USB stick. It is 42 files and
under 1 MB; product photography is loaded from the Unsplash CDN at runtime.

---

## Installing the chat widget

**Where it goes.** Every page ends with this placeholder, immediately before `</body>`:

```html
<!-- ===== TACTFUL AI WIDGET — paste the workspace snippet here ===== -->
<!-- ============================================================== -->
```

Paste your Tactful workspace snippet between those two comment lines.

**It goes on every page — all ten.** The marker is byte-identical in each file, so you can
do the whole site in one pass:

```bash
grep -l "TACTFUL AI WIDGET" nilemart-site/*.html
```

That should list `index, category, product, offers, bundles, stores, faq, track, policies,
cart`. A visitor who lands on `product.html` from search and never sees the home page still
needs the launcher.

**The bottom-right corner is reserved.** Nothing on this site is fixed or sticky within
120px of the bottom inline-end corner at any breakpoint — no back-to-top button, no cookie
bar, no floating cart, no toasts. That space belongs to the chat launcher. The footer
carries `padding-block-end: var(--widget-reserve)` so the last row of links never sits
under it either. If you add anything to this site later, keep that corner clear. In Arabic
the layout mirrors, so the launcher's corner mirrors with it — the reservation is written
with logical properties and follows automatically.

**Page context.** `js/widget-config.js` loads on every page and publishes a plain object
the widget can read once it is installed:

```js
window.NILEMART_CONTEXT = {
  page: 'product',                        // index | category | product | offers | …
  language: 'ar',                         // follows the header toggle
  category: 'Fresh Fruit & Vegetables',   // null where the page has no category
  productHandle: 'egyptian-mangoes-1kg',  // null off a product page
  cartItemCount: 3,
}
```

It is rebuilt whenever the language flips, the cart changes, or a page resolves which
product it is showing. **No Tactful API is called from here** — nothing is wired up. The
object just makes the facts available to whatever you paste in.

---

## Regenerating the data

The site reads `data/*.json`. Those are generated once from the knowledge base by a Python
script that lives one level up, next to the KB:

```bash
python3 build-data.py
```

No dependencies beyond the standard library. It reads the CSVs and policy text files under
`../NileMart-KB/` and rewrites every JSON file from scratch, printing what it produced:

```
products.json  196 SKUs in 8 categories
offers.json    offer status counts: {'active': 13, 'scheduled': 1, 'expired': 1}
stores.json    kept 14 branches, dropped 3 dark stores
faq.json       73 questions in 18 topics
bundles.json   12 bundles
orders.json    10 orders
policies.json  6 documents, each with its Arabic section
```

Re-run it after editing the KB. The script is the only thing that ever reads the CSVs; the
site never touches them.

| File | Source | Notes |
|---|---|---|
| `products.json` | the 8 `nilemart_products_0*.csv` files | Category names joined in from `nilemart_products_all_categories.csv` on `Handle`, because the per-category files carry no category column |
| `offers.json` | `nilemart_offers.csv` | All 15 rows, `status` and dates preserved. Filtering happens in the browser |
| `stores.json` | `nilemart_store_locations.csv` | The 3 `dark_store` rows are dropped at build time and never reach the browser |
| `faq.json` | `nilemart_faq_ar_en.csv` | Grouped by topic, in the sheet's own order |
| `bundles.json` | `nilemart_recipes_and_bundles.csv` | Item names split and paired with their SKUs |
| `orders.json` | `nilemart_sample_orders.csv` | `items_summary_en/ar` parsed into line items with quantities |
| `policies.json` | the 6 `.txt` files | Split into numbered English sections plus the Arabic section each file ends with |

### How the policy text is parsed

The `.txt` files are hard-wrapped plain text. The build splits each into sections on its
rule lines, then classifies every block: aligned columns stay verbatim as tables, `- `
lists become lists, and wrapped prose is re-joined into paragraphs. Numbered clauses
(`4.2 …`) keep their number as a marker. **Text is never edited, only re-flowed.**

---

## Pages

| Page | What it shows |
|---|---|
| `index.html` | Hero, the 8 category tiles, a live-offers strip, a best-seller rail, a bundles rail, the delivery-promise band |
| `category.html?c=<slug>` | One category's grid, with type and dietary filters, a price slider and sort by price / name / offers. `?c=all` shows all 196 and backs the header search |
| `product.html?h=<handle>` | Image, price with strike-through compare-at, description, origin, storage, dietary tags, add to cart, 4 related products |
| `offers.html` | Live campaigns as tickets — promo code, dates, terms, tier restriction |
| `bundles.html` | The 12 kits — items, sum-of-items vs bundle price, saving, serves, prep time |
| `stores.html` | The 14 branches — address, hours, Ramadan hours, phone, services, parking, Maps link |
| `faq.html` | 73 answers in 18 topics, accordion plus search |
| `track.html` | Order lookup. Try `NM-2026-448120` |
| `policies.html?p=<slug>` | One policy document, sidebar listing all six |
| `cart.html` | Basket in `localStorage`, quantity editing, delivery-fee logic, demo checkout modal |

## Structure

```
nilemart-site/
├── *.html            10 pages, each a thin shell — the chrome is rendered by JS
├── css/styles.css    one stylesheet, CSS custom properties, logical properties throughout
├── js/
│   ├── i18n.js       every static UI string, en + ar. No English is hard-coded in markup
│   ├── app.js        language, data loading, header/footer, price formatting
│   ├── cart.js       basket state and the delivery-fee rules
│   ├── components.js product / offer / bundle cards shared between pages
│   ├── page-*.js     one controller per page
│   └── widget-config.js
├── data/*.json       generated — do not edit by hand
└── assets/           logos and favicons, copied from ../NileMart-Brand/
```

---

## Bilingual behaviour

The **EN / ع** toggle sits in the header bar and is stored in `localStorage` under
`nilemart-lang`. A three-line inline script in each page's `<head>` applies the stored
choice before first paint, so Arabic never flashes left-to-right.

Flipping the language sets `dir="rtl"` on `<html>` and re-renders every page in place — no
reload, and filter and search state survives the flip. The layout mirrors because the
stylesheet uses logical properties (`padding-inline-start`, `inset-inline-end`,
`border-inline-start`) rather than left/right, so nav order, card alignment and the
chevrons all follow automatically.

Content comes from the Arabic columns: `title_ar`, `body_ar`, the Arabic category name,
`question_ar` / `answer_ar`, each store's `_ar` name and address, and each policy file's
Arabic section. The header logo swaps to `nilemart-logo-horizontal-ar.svg`.

**Where a row has no Arabic value the English is shown** rather than an empty cell. Nothing
is machine-translated. Latin values sitting inside Arabic pages are wrapped in `<bdi>` so
their digits and punctuation do not reorder.

**Digits are Western in both languages**, as Egyptian e-commerce sites do it:
`EGP 68` / `68 جنيه`. Knowledge-base prose keeps whatever numerals the KB itself wrote —
the Arabic policy sections use Arabic-Indic digits because that is how they were written.

---

## Brand

Colours are the exact values from `../NileMart-Brand/README.md`:

| Token | Hex | Used for |
|---|---|---|
| `--nile-deep` | `#0A3F55` | Headings and body text |
| `--nile-blue` | `#0B4A66` | Gradient start |
| `--teal` | `#12968F` | Accents, links, focus rings |
| `--teal-light` | `#17A39A` | Gradient end |
| `--gold` | `#F2A93B` | Offer badges and the primary CTA — one accent only |
| `--ink` | `#0C2431` | Dark surfaces |
| `--cream` | `#F7F4EE` | Page background |

Two shades are derived rather than taken from the brand sheet, both noted in the CSS:
`--teal-ink` (`#0E7A75`) for small text that must read as teal, because brand teal does not
clear WCAG AA at paragraph size — the brand README says exactly this — and a set of
hairline/muted neutrals for borders and secondary text.

Logos are used as the brand guide specifies: horizontal in the header (Arabic lockup in
Arabic mode), mono-white in the dark footer, the 64px favicon in the tab, and the stacked
lockup on every empty state.

Type is **Plus Jakarta Sans** and **Cairo** from Google Fonts, both with a real
system-font fallback stack. Cairo carries all Arabic. Prices are set in tabular figures
with the currency small beside the numeral, like a shelf-edge label.

---

## What the knowledge base does not cover

Left as gaps rather than filled in:

- **No ratings or reviews.** The KB has none, so no product carries stars or a review count.
- **No stock numbers.** Products show *In stock* or *Low stock* rather than a figure. The
  threshold (20 units or fewer) is a display rule applied to the real `inventory_qty`; only
  one SKU in the catalogue currently falls under it.
- **Branch services and governorate names are English-only in the store sheet**, so the
  service chips and the governorate filter stay English in Arabic mode.
- **Offer scope, usage limits, channels and tier names have no Arabic in the offers sheet.**
  Where the scope names one of the eight catalogue categories the site uses the KB's own
  Arabic category name. Everything else falls back to English, per the brief. The two
  generic scope words `All` and `Multiple` are rendered from the UI dictionary.
- **The `offer_type` column is not displayed.** It is internal jargon (`bogo`,
  `percentage_off_category`) with no Arabic variant, and the description says the same thing.
- **Arabic policy sections are summaries**, not translations of the full English document —
  that is how the source files are written. The Arabic view shows what the file contains.
- **`nilemart_response_templates.csv` is unused.** It holds canned agent replies, which
  belong to the assistant, not the storefront.
- **Product photography is category-representative Unsplash stock**, not photographs of the
  specific branded products, exactly as the KB README warns. Some images will not match
  their SKU closely.
- **No account, login, checkout or payment.** Checkout opens a modal saying this is a demo.

### Two behaviours worth knowing before you demo

**The Express delivery fee is never waived by basket value.** The cart applies the rule from
the delivery policy (section 2.1): free delivery at EGP 1,200 applies to *Same-day* and
*Next-day* only, and Express stays at EGP 79 — waived only by Platinum tier or a named
campaign. The cart says so when Express is selected. A one-line summary of the threshold
would suggest otherwise; the policy file is authoritative and the site follows it.

**Offers are filtered against the browser's clock.** `offers.html` renders a campaign only
when `status = active` *and* `end_date` has not passed, which is why the deliberately
expired `OFF-015` and the scheduled `OFF-012` never appear — that pair is the test that the
filter works. The KB's campaigns run to late 2026 and into 2027, so a machine whose clock is
set well past those dates will show fewer offers, and eventually the page's empty state.
That is the filter behaving correctly, not a bug.

---

## Checks

The site was verified across every page, both languages, at 360px and 1440px: no console
errors, no failed requests, no horizontal overflow, correct `dir` mirroring, and nothing
fixed or sticky in the bottom-right corner. Interaction checks cover the language toggle,
add-to-cart and the delivery-fee maths, the category filters and sort, the FAQ accordion and
search, order lookup for both known and unknown numbers, and the demo modal.

---

**NileMart is a fictional brand.** The company, its branches, phone numbers, prices, offers
and order records are synthetic content created for a Tactful AI demonstration. Nothing on
this site can be bought.
