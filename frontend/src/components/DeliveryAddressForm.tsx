import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"

type AddressFormData = {
  recipientName: string
  country: string
  province: string
  district: string
  street: string
  phone: string
  whatsapp?: string
}

export default function DeliveryAddressForm({
  onSave,
}: {
  onSave: (data: AddressFormData & { orderCode: string }) => void
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<AddressFormData>({ mode: "onChange" })

  const [orderCode, setOrderCode] = useState("")
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    setOrderCode("ORD-" + Math.floor(100000 + Math.random() * 900000))
  }, [])

  const formatPhone = (v: string) => v.replace(/\D/g, "").slice(0, 12)

  const submitHandler = (data: AddressFormData) => {
    onSave({ ...data, orderCode })
    setSuccess(true)
  }

  return (
    <form
      onSubmit={handleSubmit(submitHandler)}
      className="max-w-lg mx-auto bg-slate-800 p-6 rounded-lg shadow-lg text-slate-200 space-y-4"
    >
      <h2 className="text-xl font-bold">Endereço de Entrega</h2>

      <div>
        <label className="block mb-1 font-semibold">Código da Encomenda</label>
        <input
          value={orderCode}
          readOnly
          className="w-full p-2 rounded bg-slate-700 border border-slate-600"
        />
      </div>

      {[
        ["recipientName", "Nome do Destinatário"],
        ["country", "País"],
        ["province", "Província"],
        ["district", "Distrito / Cidade"],
        ["street", "Rua / Bairro"],
      ].map(([name, label]) => (
        <div key={name}>
          <label className="block mb-1 font-semibold">{label}</label>
          <input
            {...register(name as any, { required: "Campo obrigatório" })}
            className={`w-full p-2 rounded bg-slate-700 border ${
              errors[name as keyof AddressFormData]
                ? "border-red-500"
                : "border-slate-600"
            }`}
          />
          {errors[name as keyof AddressFormData] && (
            <span className="text-red-500 text-sm">
              {(errors[name as keyof AddressFormData] as any)?.message}
            </span>
          )}
        </div>
      ))}

      <div>
        <label className="block mb-1 font-semibold">Número de Telefone</label>
        <input
          {...register("phone", { required: "Campo obrigatório", minLength: 7 })}
          onChange={(e) => (e.target.value = formatPhone(e.target.value))}
          className={`w-full p-2 rounded bg-slate-700 border ${
            errors.phone ? "border-red-500" : "border-slate-600"
          }`}
        />
      </div>

      <div>
        <label className="block mb-1 font-semibold">WhatsApp (opcional)</label>
        <input
          {...register("whatsapp")}
          onChange={(e) => (e.target.value = formatPhone(e.target.value))}
          className="w-full p-2 rounded bg-slate-700 border border-slate-600"
        />
      </div>

      <button
        type="submit"
        disabled={!isValid}
        className="w-full p-3 rounded bg-emerald-500 text-slate-900 font-bold hover:bg-emerald-400 disabled:opacity-50"
      >
        Salvar e Continuar
      </button>

      {success && (
        <div className="text-green-400 text-sm font-medium">
          Endereço salvo com sucesso ✅
        </div>
      )}
    </form>
  )
}