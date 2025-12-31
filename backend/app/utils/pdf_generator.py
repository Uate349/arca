# backend/app/utils/pdf_generator.py
from reportlab.lib.pagesizes import A6
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
from reportlab.lib import colors
import qrcode
import io

def generate_order_pdf(order: dict) -> str:
    """
    Gera PDF do pedido com endereço e lista de produtos.
    Retorna o caminho do arquivo gerado.
    """
    order_id = order.get("id")
    delivery_address = order.get("delivery_address", {})
    items = order.get("items", [])
    total_amount = order.get("total_amount", "0.00")

    filename = f"./app/tmp/order_{order_id}.pdf"
    c = canvas.Canvas(filename, pagesize=A6)
    width, height = A6

    # Fundo branco
    c.setFillColor(colors.white)
    c.rect(0, 0, width, height, fill=True, stroke=False)

    # Título
    c.setFont("Helvetica-Bold", 12)
    c.setFillColor(colors.black)
    c.drawString(10*mm, height - 15*mm, f"Pedido: ORD-{order_id}")

    # Dados do destinatário
    c.setFont("Helvetica", 9)
    y = height - 25*mm
    c.drawString(10*mm, y, f"Nome: {delivery_address.get('recipientName', '')}")
    y -= 5*mm
    c.drawString(10*mm, y, f"País: {delivery_address.get('country', '')}")
    y -= 5*mm
    c.drawString(10*mm, y, f"Província: {delivery_address.get('province', '')}")
    y -= 5*mm
    c.drawString(10*mm, y, f"Distrito / Cidade: {delivery_address.get('district', '')}")
    y -= 5*mm
    c.drawString(10*mm, y, f"Rua / Bairro: {delivery_address.get('street', '')}")
    y -= 5*mm
    c.drawString(10*mm, y, f"Telefone: {delivery_address.get('phone', '')}")
    whatsapp = delivery_address.get("whatsapp")
    if whatsapp:
        y -= 5*mm
        c.drawString(10*mm, y, f"WhatsApp: {whatsapp}")

    # Lista de produtos
    y -= 10*mm
    c.setFont("Helvetica-Bold", 9)
    c.drawString(10*mm, y, "Produtos:")
    c.setFont("Helvetica", 9)
    y -= 5*mm
    for item in items:
        line = f"{item.get('name')} x{item.get('quantity')} - {item.get('price')} MT"
        c.drawString(12*mm, y, line)
        y -= 4*mm

    # Total
    y -= 5*mm
    c.setFont("Helvetica-Bold", 10)
    c.drawString(10*mm, y, f"Total: {total_amount} MT")

    # QR code com ID do pedido
    qr = qrcode.QRCode(box_size=2, border=0)
    qr.add_data(f"ORD-{order_id}")
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")

    img_buffer = io.BytesIO()
    img.save(img_buffer)
    img_buffer.seek(0)

    c.drawInlineImage(img_buffer, width - 35*mm, 10*mm, 25*mm, 25*mm)

    c.showPage()
    c.save()

    return filename