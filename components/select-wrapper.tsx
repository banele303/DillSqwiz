// Server-component-safe select dropdown (no client hooks)
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function SelectWrapper({ name, options }: {
  name: string
  options: Array<{ v: string; l: string }>
}) {
  return (
    <Select name={name} defaultValue={options[0].v}>
      <SelectTrigger className="bg-white/[0.05] border-white/[0.08] text-white">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="bg-[#030712] border-white/[0.08] text-white">
        {options.map((o) => (
          <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
