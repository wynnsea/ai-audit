import { modelLabel } from "@/lib/format";
import { Select } from "../select";

type Props = {
  models: string[];
  model: string | null;
  disabled: boolean;
  onChange: (model: string) => void;
};

// dipakai di bawah layar (kotak chat, form upload), jadi daftarnya membuka ke atas dan rata kanan
export function ModelSelect({ models, model, disabled, onChange }: Props) {
  return (
    <Select
      options={models.map((m) => ({ value: m, label: modelLabel(m) }))}
      value={model}
      onChange={onChange}
      ariaLabel="Model AI"
      placeholder="Pilih model"
      disabled={disabled}
      placement="up"
      align="right"
    />
  );
}
