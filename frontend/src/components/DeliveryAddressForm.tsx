import { FormEvent, useState } from "react"

export default function DeliveryAddressForm({ onSave }: { onSave: (data: any) => void }) {
  const [orderCode] = useState(`ORD-${Math.floor(100000 + Math.random() * 900000)}`)
  const [recipientName, setRecipientName] = useState("")
  const [country, setCountry] = useState("")
  const [province, setProvince] = useState("")
  const [district, setDistrict] = useState("")
  const [street, setStreet] = useState("")
  const [phone, setPhone] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()

    if (!recipientName || !country || !province || !district || !street || !phone) {
      setError("Preencha todos os campos obrigatórios.")
      return
    }

    const data = {
      orderCode,
      recipientName,
      country,
      province,
      district,
      street,
      phone,
      whatsapp,
    }

    onSave(data)
    setError(null)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-slate-900 p-4 rounded-lg space-y-3">
      <h3 className="font-semibold text-emerald-400">Endereço de Entrega</h3>

      <div>
        <label className="text-xs text-slate-400">Código da Encomenda</label>
        <input value={orderCode} disabled className="w-full bg-slate-800 p-2 rounded" />
      </div>

      <input placeholder="Nome do Destinatário" className="w-full bg-slate-800 p-2 rounded"
        value={recipientName} onChange={(e) => setRecipientName(e.target.value)} />

      <input placeholder="País" className="w-full bg-slate-800 p-2 rounded"
        value={country} onChange={(e) => setCountry(e.target.value)} />

      <input placeholder="Província" className="w-full bg-slate-800 p-2 rounded"
        value={province} onChange={(e) => setProvince(e.target.value)} />

      <input placeholder="Distrito / Cidade" className="w-full bg-slate-800 p-2 rounded"
        value={district} onChange={(e) => setDistrict(e.target.value)} />

      <input placeholder="Rua / Bairro" className="w-full bg-slate-800 p-2 rounded"
        value={street} onChange={(e) => setStreet(e.target.value)} />

      <input placeholder="Número de Telefone" className="w-full bg-slate-800 p-2 rounded"
        value={phone} onChange={(e) => setPhone(e.target.value)} />

      <input placeholder="WhatsApp (opcional)" className="w-full bg-slate-800 p-2 rounded"
        value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />

      {error && <div className="text-red-400 text-xs">{error}</div>}

      <button type="submit" className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-4 py-2 rounded-lg font-semibold">
        Salvar e Continuar
      </button>
    </form>
  )
}