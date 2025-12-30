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
  const { register, handleSubmit, formState } = useForm<AddressFormData>({ mode: "onChange" });
  const { errors, isValid } = formState;
  const [orderCode, setOrderCode] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const code = "ORD-" + Math.floor(100000 + Math.random() * 900000);
    setOrderCode(code);
  }, []);

  const submitHandler = (data: AddressFormData) => {
    try {
      onSave({ ...data, orderCode });
      setSuccess(true); // sinaliza sucesso
    } catch (err) {
      setSuccess(false);
    }
  };

  const formatPhone = (value: string) => value.replace(/\D/g, "").slice(0, 12);

  return (
    <form
      onSubmit={handleSubmit(submitHandler)}
      className="max-w-lg mx-auto bg-slate-800 p-6 rounded-lg shadow-lg text-slate-200"
    >
      <h2 className="text-xl font-bold mb-4">Endereço de Entrega</h2>

      {/* ... campos do formulário (igual antes) ... */}

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
