import { NumberField } from '../../../components/NumberField.tsx'
import { TextField } from '../../../components/TextField.tsx'
import { cn } from '../../../lib/cn.ts'
import type { ProductRow } from '../formState.ts'
import { COPY } from '../labels.ts'
import { useNewestRowOpen } from '../hooks/useNewestRowOpen.ts'

type ProductRowsProps = {
  products: ProductRow[]
  errorFor: (path: string) => string | null
  onFieldChange: (index: number, field: keyof Omit<ProductRow, 'id'>, value: string) => void
  onBlur: (path: string) => void
  onAdd: () => void
  onRemove: (index: number) => void
}

/**
 * The only section the model cannot proceed without (`empty_products`):
 * every other section has a workable default, products do not.
 *
 * Below `lg` each row collapses to a one-line summary — name, price, daily
 * quantity — that opens in place; a row just added opens itself and scrolls
 * into view (`useNewestRowOpen`). From `lg` up every row is always open.
 */
export function ProductRows({ products, errorFor, onFieldChange, onBlur, onAdd, onRemove }: ProductRowsProps) {
  const rows = useNewestRowOpen(products.map((product) => product.id))

  return (
    <div className="space-y-3.5 lg:space-y-5">
      {products.map((product, index) => {
        const open = rows.isOpen(product.id)
        const summary = [product.normalPrice ? `$${product.normalPrice}` : null, product.dailyQuantity ? `${product.dailyQuantity}/day` : null].filter(Boolean).join(' · ')

        return (
          <div key={product.id} ref={rows.rowRef(product.id)} className="rounded border border-qc-rule p-3.5">
            <button type="button" onClick={() => rows.toggle(product.id)} aria-expanded={open} className="flex min-h-[44px] w-full items-center justify-between gap-3 text-left lg:hidden">
              <span className="text-[15px] text-qc-ink">{product.name.trim() === '' ? `${COPY.byProductTitle} ${index + 1}` : product.name}</span>
              <span className="flex items-center gap-2.5">
                <span className="font-mono text-xs tabular-nums text-qc-muted">{summary}</span>
                <span
                  aria-hidden="true"
                  className={cn('inline-block h-[7px] w-[7px] border-b-[1.5px] border-r-[1.5px] border-qc-muted', open ? '-translate-y-1 rotate-[-135deg]' : '-translate-y-0.5 rotate-45')}
                />
              </span>
            </button>

            <div className="mb-3 hidden items-center justify-between lg:flex">
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-qc-muted">
                {COPY.byProductTitle} {index + 1}
              </span>
              {products.length > 1 ? (
                <button type="button" onClick={() => onRemove(index)} className="qc-text-btn">
                  {COPY.removeRow}
                </button>
              ) : null}
            </div>

            <div className={cn('grid grid-cols-2 gap-x-[13px] gap-y-[15px] pt-3 lg:pt-0', open ? 'grid' : 'hidden lg:grid')}>
              <TextField
                id={`products.${index}.name`}
                label="Product name"
                value={product.name}
                onChange={(value) => onFieldChange(index, 'name', value)}
                onBlur={() => onBlur(`products.${index}.name`)}
                error={errorFor(`products.${index}.name`)}
              />
              <NumberField
                id={`products.${index}.dailyQuantity`}
                label="Daily quantity"
                value={product.dailyQuantity}
                onChange={(value) => onFieldChange(index, 'dailyQuantity', value)}
                onBlur={() => onBlur(`products.${index}.dailyQuantity`)}
                unit="units/day"
                error={errorFor(`products.${index}.dailyQuantity`)}
                grouped
              />
              <NumberField
                id={`products.${index}.normalPrice`}
                label="Dine-in / takeout price"
                value={product.normalPrice}
                onChange={(value) => onFieldChange(index, 'normalPrice', value)}
                onBlur={() => onBlur(`products.${index}.normalPrice`)}
                unit="$"
                error={errorFor(`products.${index}.normalPrice`)}
                grouped
              />
              <NumberField
                id={`products.${index}.onlinePrice`}
                label="Delivery price"
                value={product.onlinePrice}
                onChange={(value) => onFieldChange(index, 'onlinePrice', value)}
                onBlur={() => onBlur(`products.${index}.onlinePrice`)}
                unit="$"
                error={errorFor(`products.${index}.onlinePrice`)}
                grouped
              />
              <NumberField
                id={`products.${index}.unitProductCost`}
                label="Unit product cost (COGS)"
                value={product.unitProductCost}
                onChange={(value) => onFieldChange(index, 'unitProductCost', value)}
                onBlur={() => onBlur(`products.${index}.unitProductCost`)}
                unit="$"
                error={errorFor(`products.${index}.unitProductCost`)}
                span="full"
                grouped
              />
              {products.length > 1 ? (
                <button type="button" onClick={() => onRemove(index)} className="qc-text-btn col-span-2 text-left lg:hidden">
                  {COPY.removeRow}
                </button>
              ) : null}
            </div>
          </div>
        )
      })}
      <button type="button" onClick={onAdd} className="qc-text-btn is-accent text-sm">
        {COPY.addProduct}
      </button>
      {errorFor('products') ? (
        <p className="qc-error" role="alert">
          {errorFor('products')}
        </p>
      ) : null}
    </div>
  )
}
