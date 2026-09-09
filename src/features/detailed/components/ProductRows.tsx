import { NumberField } from '../../../components/NumberField.tsx'
import { TextField } from '../../../components/TextField.tsx'
import type { ProductRow } from '../formState.ts'
import { COPY } from '../labels.ts'

type ProductRowsProps = {
  products: ProductRow[]
  errorFor: (path: string) => string | null
  onFieldChange: (index: number, field: keyof Omit<ProductRow, 'id'>, value: string) => void
  onBlur: (path: string) => void
  onAdd: () => void
  onRemove: (index: number) => void
}

/**
 * The only section the model cannot proceed without (`empty_products`): every
 * other section has a workable default, products do not.
 */
export function ProductRows({ products, errorFor, onFieldChange, onBlur, onAdd, onRemove }: ProductRowsProps) {
  return (
    <div className="space-y-5">
      {products.map((product, index) => (
        <div key={product.id} className="rounded border border-qc-rule p-3.5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-qc-muted">
              {COPY.byProductTitle} {index + 1}
            </span>
            {products.length > 1 ? (
              <button type="button" onClick={() => onRemove(index)} className="qc-text-btn">
                {COPY.removeRow}
              </button>
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-x-[13px] gap-y-[15px]">
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
          </div>
        </div>
      ))}
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
