import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";

type AddressFormData = {
  recipientName: string;
  country: string;
  province: string;
  district: string;
  street: string;
  phone: string;
  whatsapp?: string;
};

export default function DeliveryAddressForm({
  onSave,
}: {
  onSave: (data: AddressFormData & { orderCode: string }) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<AddressFormData>({ mode: "onChange" });

  const [orderCode, setOrderCode] = useState("");
  const [success, setSuccess] = useState(false);

  // Gera código da encomenda automaticamente
  useEffect(() => {
    const code = "ORD-" + Math.floor(100000 + Math.random() * 900000);
    setOrderCode(code);
  }, []);

  // Formatação de telefone
  const formatPhone = (value: string) => value.replace(/\D/g, "").slice(0, 12);

  // Handler do formulário
  const submitHandler = (data: AddressFormData) => {
    // ✅ Garante que todos os campos obrigatórios estão preenchidos
    if (
      !data.recipientName ||
      !data.country ||
      !data.province ||
      !data.district ||
      !data.street ||
      !data.phone
    ) {
      setSuccess(false);
      return;
    }

    onSave({ ...data, orderCode });
    setSuccess(true);
  };

  return (
    <form
      onSubmit={handleSubmit(submitHandler)}
      className="max-w-lg mx-auto bg-slate-800 p-6 rounded-lg shadow-lg text-slate-200 space-y-4"
    >
      <h2 className="text-xl font-bold mb-4">Endereço de Entrega</h2>

      {/* Código da encomenda */}
      <div>
        <label className="block mb-1 font-semibold">Código da Encomenda</label>
        <input
          type="text"
          value={orderCode}
          readOnly
          className="w-full p-2 rounded bg-slate-700 border border-slate-600"
        />
      </div>

      {/* Nome do destinatário */}
      <div>
        <label className="block mb-1 font-semibold">Nome do Destinatário</label>
        <input
          {...register("recipientName", { required: "Campo obrigatório" })}
          className={`w-full p-2 rounded bg-slate-700 border ${
            errors.recipientName ? "border-red-500" : "border-slate-600"
          }`}
        />
        {errors.recipientName && (
          <span className="text-red-500 text-sm">{errors.recipientName.message}</span>
        )}
      </div>

      {/* País */}
      <div>
        <label className="block mb-1 font-semibold">País</label>
        <input
          {...register("country", { required: "Campo obrigatório" })}
          className={`w-full p-2 rounded bg-slate-700 border ${
            errors.country ? "border-red-500" : "border-slate-600"
          }`}
        />
        {errors.country && (
          <span className="text-red-500 text-sm">{errors.country.message}</span>
        )}
      </div>

      {/* Província / Estado */}
      <div>
        <label className="block mb-1 font-semibold">Província / Estado</label>
        <input
          {...register("province", { required: "Campo obrigatório" })}
          className={`w-full p-2 rounded bg-slate-700 border ${
            errors.province ? "border-red-500" : "border-slate-600"
          }`}
        />
        {errors.province && (
          <span className="text-red-500 text-sm">{errors.province.message}</span>
        )}
      </div>

      {/* Distrito / Cidade */}
      <div>
        <label className="block mb-1 font-semibold">Distrito / Município / Cidade</label>
        <input
          {...register("district", { required: "Campo obrigatório" })}
          className={`w-full p-2 rounded bg-slate-700 border ${
            errors.district ? "border-red-500" : "border-slate-600"
          }`}
        />
        {errors.district && (
          <span className="text-red-500 text-sm">{errors.district.message}</span>
        )}
      </div>

      {/* Rua / Bairro */}
      <div>
        <label className="block mb-1 font-semibold">Rua / Bairro / Referência</label>
        <input
          {...register("street", { required: "Campo obrigatório" })}
          className={`w-full p-2 rounded bg-slate-700 border ${
            errors.street ? "border-red-500" : "border-slate-600"
          }`}
        />
        {errors.street && (
          <span className="text-red-500 text-sm">{errors.street.message}</span>
        )}
      </div>

      {/* Telefone */}
      <div>
        <label className="block mb-1 font-semibold">Número de Telefone</label>
        <input
          {...register("phone", { required: "Campo obrigatório", minLength: 7 })}
          onChange={(e) => (e.target.value = formatPhone(e.target.value))}
          className={`w-full p-2 rounded bg-slate-700 border ${
            errors.phone ? "border-red-500" : "border-slate-600"
          }`}
        />
        {errors.phone && (
          <span className="text-red-500 text-sm">
            {errors.phone.type === "required" ? "Campo obrigatório" : "Número inválido"}
          </span>
        )}
      </div>

      {/* WhatsApp opcional */}
      <div>
        <label className="block mb-1 font-semibold">WhatsApp (opcional)</label>
        <input
          {...register("whatsapp")}
          onChange={(e) => (e.target.value = formatPhone(e.target.value))}
          className="w-full p-2 rounded bg-slate-700 border border-slate-600"
        />
      </div>

      {/* Botão salvar */}
      <button
        type="submit"
        disabled={!isValid}
        className="w-full p-3 rounded bg-emerald-500 text-slate-900 font-bold hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Salvar e Continuar
      </button>

      {/* Mensagem de sucesso */}
      {success && (
        <div className="mt-2 text-green-400 text-sm font-medium">
          Endereço salvo com sucesso ✅
        </div>
      )}
    </form>
  );
}