import { zodResolver } from '@hookform/resolvers/zod';
import {
  createProductSchema,
  type CreateProductFormInput,
  type CreateProductInput,
  type Product,
} from '@ordo/shared';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { useProduct, useSaveProduct } from './useProductMutations';
import { useAuth } from '@/core/auth/use-auth';
import { Button } from '@/shared/ui/Button';
import { TextField } from '@/shared/ui/TextField';
import { buttonClasses } from '@/shared/ui/button-styles';

const emptyProduct: CreateProductFormInput = {
  name: '',
  sku: '',
  unit: 'unidad',
  description: '',
  category: '',
  supplier: '',
  stock: 0,
  minStock: 0,
  costPrice: 0,
  salePrice: 0,
};

function toFormValues(p: Product): CreateProductInput {
  return {
    name: p.name,
    sku: p.sku,
    unit: p.unit,
    description: p.description ?? '',
    category: p.category ?? '',
    supplier: p.supplier ?? '',
    stock: p.stock,
    minStock: p.minStock,
    costPrice: p.costPrice,
    salePrice: p.salePrice,
  };
}

/** Creates or edits a product, depending on whether the route carries an id. */
export function ProductFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const auth = useAuth();
  const isAdmin = auth.status === 'authenticated' && auth.user.role === 'admin';

  const { data: product } = useProduct(id);
  const save = useSaveProduct(id);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateProductFormInput, unknown, CreateProductInput>({
    resolver: zodResolver(createProductSchema),
    defaultValues: emptyProduct,
  });

  // Once per product, not once per response: the query serves the cached list entry
  // first and then refetches, and a second reset would wipe whatever has been typed
  // in the meantime.
  const filledFor = useRef<string>(null);
  useEffect(() => {
    if (product && filledFor.current !== product.id) {
      filledFor.current = product.id;
      reset(toFormValues(product));
    }
  }, [product, reset]);

  // Writes are admin-only. The backend enforces this too, with a 403.
  useEffect(() => {
    if (!isAdmin) navigate('/inventory', { replace: true });
  }, [isAdmin, navigate]);

  if (!isAdmin) return null;

  function onSubmit(data: CreateProductInput) {
    // Optional text fields go as undefined rather than as empty strings.
    const payload = {
      ...data,
      description: data.description || undefined,
      category: data.category || undefined,
      supplier: data.supplier || undefined,
    };
    // Back to the product's own sheet rather than the bare list, so the change is
    // visible where it was made. A create lands on the product it just made.
    save.mutate(payload, {
      onSuccess: (product) =>
        navigate(`/inventory?product=${product.id}`, { replace: true }),
    });
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <Link
        to="/inventory"
        className="inline-flex items-center gap-1.5 text-sm text-fg-muted transition-colors hover:text-fg"
      >
        <ArrowLeft size={16} strokeWidth={1.75} />
        Volver al inventario
      </Link>
      <h1 className="mt-3 font-display text-2xl font-semibold tracking-tight">
        {isEdit ? 'Editar producto' : 'Nuevo producto'}
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-1">
        <div className="grid gap-x-5 sm:grid-cols-2">
          <TextField
            label="Nombre"
            id="name"
            {...register('name')}
            error={errors.name?.message}
          />
          <TextField
            label="SKU"
            id="sku"
            {...register('sku')}
            error={errors.sku?.message}
          />
          <TextField
            label="Categoría"
            id="category"
            {...register('category')}
            error={errors.category?.message}
          />
          <TextField
            label="Proveedor"
            id="supplier"
            {...register('supplier')}
            error={errors.supplier?.message}
          />
          <TextField
            label="Unidad"
            id="unit"
            {...register('unit')}
            error={errors.unit?.message}
          />
          <TextField
            label="Stock"
            id="stock"
            type="number"
            step="any"
            {...register('stock', { valueAsNumber: true })}
            error={errors.stock?.message}
          />
          <TextField
            label="Stock mínimo"
            id="minStock"
            type="number"
            step="any"
            {...register('minStock', { valueAsNumber: true })}
            error={errors.minStock?.message}
          />
          <TextField
            label="Precio de coste"
            id="costPrice"
            type="number"
            step="any"
            {...register('costPrice', { valueAsNumber: true })}
            error={errors.costPrice?.message}
          />
          <TextField
            label="Precio de venta"
            id="salePrice"
            type="number"
            step="any"
            {...register('salePrice', { valueAsNumber: true })}
            error={errors.salePrice?.message}
          />
        </div>
        <TextField
          label="Descripción"
          id="description"
          {...register('description')}
          error={errors.description?.message}
        />

        {save.isError && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {(save.error as Error).message}
          </p>
        )}

        <div className="flex items-center gap-2 pt-4">
          <Button type="submit" disabled={save.isPending}>
            {isEdit ? 'Guardar cambios' : 'Crear producto'}
          </Button>
          <Link to="/inventory" className={buttonClasses('secondary')}>
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
