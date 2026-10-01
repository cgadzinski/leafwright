"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORY_LIST } from "@/lib/catalog";
import type { Product } from "@/lib/db/schema";
import { archiveProduct, publishProduct, saveProduct, type ProductFormState } from "./actions";

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function NativeSelect({
  id,
  name,
  defaultValue,
  options,
  testId,
}: {
  id: string;
  name: string;
  defaultValue: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  testId: string;
}) {
  return (
    <Select name={name} defaultValue={defaultValue}>
      <SelectTrigger id={id} data-testid={testId}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const LIGHT = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "bright", label: "Bright" },
];
const WATER = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];
const DIFFICULTY = [
  { value: "easy", label: "Easy" },
  { value: "moderate", label: "Moderate" },
  { value: "expert", label: "Expert" },
];

export function ProductForm({ product }: { product?: Product }) {
  const [saveState, saveAction, saving] = useActionState<ProductFormState, FormData>(
    saveProduct,
    {},
  );
  const [publishState, publishAction, publishing] = useActionState<ProductFormState, FormData>(
    publishProduct,
    {},
  );
  const state = publishState.error ? publishState : saveState;
  const errors = state.fieldErrors ?? {};
  const pending = saving || publishing;
  const published = product?.status === "published";

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
      <form className="space-y-6" noValidate>
        {product ? <input type="hidden" name="id" value={product.id} /> : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="product-name" label="Name" error={errors.name}>
            <Input
              id="product-name"
              name="name"
              defaultValue={product?.name ?? ""}
              data-testid="product-name"
            />
          </Field>
          <Field id="product-slug" label="URL slug" error={errors.slug}>
            <Input
              id="product-slug"
              name="slug"
              placeholder="auto from name"
              defaultValue={product?.slug ?? ""}
              data-testid="product-slug"
            />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field id="product-category" label="Category" error={errors.category}>
            <NativeSelect
              id="product-category"
              name="category"
              defaultValue={product?.category ?? "tropicals"}
              options={CATEGORY_LIST.map((c) => ({ value: c.slug, label: c.label }))}
              testId="product-category"
            />
          </Field>
          <Field id="product-price" label="Price (USD)" error={errors.price}>
            <Input
              id="product-price"
              name="price"
              inputMode="decimal"
              defaultValue={product ? (product.price / 100).toFixed(2) : ""}
              data-testid="product-price"
            />
          </Field>
          <Field
            id="product-compare-at-price"
            label="Compare-at price"
            error={errors.compareAtPrice}
          >
            <Input
              id="product-compare-at-price"
              name="compareAtPrice"
              inputMode="decimal"
              defaultValue={
                product?.compareAtPrice ? (product.compareAtPrice / 100).toFixed(2) : ""
              }
              data-testid="product-compare-at-price"
            />
          </Field>
        </div>
        <Field id="product-inventory" label="Inventory" error={errors.inventory}>
          <Input
            id="product-inventory"
            name="inventory"
            type="number"
            min={0}
            defaultValue={product?.inventory ?? 0}
            className="w-32"
            data-testid="product-inventory"
          />
        </Field>
        <Field id="product-description" label="Description" error={errors.description}>
          <Textarea
            id="product-description"
            name="description"
            rows={5}
            defaultValue={product?.description ?? ""}
            data-testid="product-description"
          />
        </Field>
        <fieldset className="grid gap-4 sm:grid-cols-3">
          <legend className="mb-2 text-sm font-medium">Care</legend>
          <Field id="product-light" label="Light">
            <NativeSelect
              id="product-light"
              name="light"
              defaultValue={product?.care.light ?? "medium"}
              options={LIGHT}
              testId="product-light"
            />
          </Field>
          <Field id="product-water" label="Water">
            <NativeSelect
              id="product-water"
              name="water"
              defaultValue={product?.care.water ?? "medium"}
              options={WATER}
              testId="product-water"
            />
          </Field>
          <Field id="product-difficulty" label="Difficulty">
            <NativeSelect
              id="product-difficulty"
              name="difficulty"
              defaultValue={product?.care.difficulty ?? "easy"}
              options={DIFFICULTY}
              testId="product-difficulty"
            />
          </Field>
          <div className="flex items-center gap-2 sm:col-span-3">
            <Checkbox
              id="product-pet-safe"
              name="petSafe"
              defaultChecked={product?.care.petSafe ?? false}
              data-testid="product-pet-safe"
            />
            <Label htmlFor="product-pet-safe">Pet-safe</Label>
          </div>
        </fieldset>

        {state.error ? (
          <p role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Button
            type="submit"
            variant="outline"
            formAction={saveAction}
            disabled={pending}
            data-testid="product-save-draft"
          >
            {saving ? "Saving…" : published ? "Save changes" : "Save draft"}
          </Button>
          <Button
            type="submit"
            formAction={publishAction}
            disabled={pending}
            data-testid="product-publish"
          >
            {publishing ? "Publishing…" : published ? "Save and republish" : "Publish"}
          </Button>
        </div>
      </form>

      {product ? (
        <aside className="h-fit space-y-4 rounded-xl border p-4 text-sm">
          <div>
            <p className="text-muted-foreground">Status</p>
            <p className="font-medium capitalize" data-testid="product-status">
              {product.status}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Created</p>
            <p>{new Date(product.createdAt).toLocaleDateString("en-US")}</p>
          </div>
          {product.publishedAt ? (
            <div>
              <p className="text-muted-foreground">First published</p>
              <p>{new Date(product.publishedAt).toLocaleDateString("en-US")}</p>
            </div>
          ) : null}
          {product.variants.length ? (
            <div>
              <p className="text-muted-foreground">Variants</p>
              <ul className="mt-1 space-y-1">
                {product.variants.map((variant) => (
                  <li key={variant.id} className="flex justify-between">
                    <span>{variant.label}</span>
                    <span className="text-muted-foreground">{variant.inventory} in stock</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {product.status !== "archived" ? (
            <form action={archiveProduct}>
              <input type="hidden" name="id" value={product.id} />
              <Button
                type="submit"
                variant="destructive"
                size="sm"
                className="w-full"
                data-testid="product-archive"
              >
                Archive product
              </Button>
            </form>
          ) : null}
        </aside>
      ) : null}
    </div>
  );
}
