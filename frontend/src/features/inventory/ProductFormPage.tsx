import { zodResolver } from '@hookform/resolvers/zod';
import {
  createProductSchema,
  type CreateProductFormInput,
  type CreateProductInput,
  type Product,
} from '@ordo/shared';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { useProduct, useSaveProduct, useDeleteProduct } from './useProductMutations';
import { useAuth } from '@/core/auth/use-auth';
import { Button } from '@/shared/ui/Button';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
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

export function ProductFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const auth = useAuth();
  const isAdmin = auth.status === 'authenticated' && auth.user.role === 'admin';
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: product } = useProduct(id);
  const save = useSaveProduct(id);
  const remove = useDeleteProduct();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateProductFormInput, unknown, CreateProductInput>({
    resolver: zodResolver(createProductSchema),
    defaultValues: emptyProduct,
  });

  useEffect(() => {
    if (product) reset(toFormValues(product));
  }, [product, reset]);

  // Writes are admin-only; an employee who reaches this URL is sent back to the list
  // (the backend also enforces it with a 403).
  useEffect(() => {
    if (!isAdmin) navigate('/inventory', { replace: true });
  }, [isAdmin, navigate]);

  if (!isAdmin) return null;

  function onSubmit(data: CreateProductInput) {
    // Send optional text fields as undefined rather than empty strings.
    const payload = {
      ...data,
      description: data.description || undefined,
      category: data.category || undefined,
      supplier: data.supplier || undefined,
    };
    save.mutate(payload, { onSuccess: () => navigate('/inventory') });
  }

  function onDelete() {
    if (!id) return;
    remove.mutate(id, { onSuccess: () => navigate('/inventory') });
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
      <div className="mt-3 flex items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          {isEdit ? 'Editar producto' : 'Nuevo producto'}
        </h1>
        {isEdit && (
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            aria-label="Eliminar producto"
            title="Eliminar producto"
            className="inline-flex shrink-0 items-center justify-center rounded-md border border-border p-2 text-fg-muted transition-colors hover:border-red-500 hover:text-red-600"
          >
            <Trash2 size={18} strokeWidth={1.75} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-1">
        <div className="grid gap-x-5 sm:grid-cols-2">
          <TextField label="Nombre" id="name" {...register('name')} error={errors.name?.message} />
          <TextField label="SKU" id="sku" {...register('sku')} error={errors.sku?.message} />
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
          <TextField label="Unidad" id="unit" {...register('unit')} error={errors.unit?.message} />
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
          <p className="text-sm text-red-600 dark:text-red-400">{(save.error as Error).message}</p>
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

      <ConfirmDialog
        open={confirmOpen}
        title="Eliminar producto"
        message="Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        destructive
        onConfirm={() => {
          setConfirmOpen(false);
          onDelete();
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
