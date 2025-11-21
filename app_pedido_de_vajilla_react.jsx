import React, { useState, useEffect } from 'react';

// App de ejemplo: "Pedido de Vajilla"
// - Single-file React component (default export)
// - Usa clases Tailwind para estilo (no import de Tailwind aquí; asume que el proyecto ya tiene Tailwind configurado)
// - Datos de ejemplo en memoria (productos y reservas). Reemplazar con llamadas a API/DB en producción.
// - Incluye comprobación de stock por fecha solicitada
// - Instrucciones de integración al final del archivo (comentadas)

// --- PWA CONFIG START ---
// Archivo manifest recomendado (crear como public/manifest.json)
// {
//   "name": "JYL - Pedido de Vajilla",
//   "short_name": "JYL Vajilla",
//   "start_url": "/",
//   "display": "standalone",
//   "background_color": "#000000",
//   "theme_color": "#d4af37",
//   "icons": [
//     {"src": "/icon-192.png", "sizes": "192x192", "type": "image/png"},
//     {"src": "/icon-512.png", "sizes": "512x512", "type": "image/png"}
//   ]
// }
//
// En index.html agregar:
// <link rel="manifest" href="/manifest.json" />
//
// Registrar Service Worker (src/service-worker.js):
// self.addEventListener('install', event => { self.skipWaiting(); });
// self.addEventListener('activate', event => { clients.claim(); });
//
// En index.js agregar:
// if ('serviceWorker' in navigator) { navigator.serviceWorker.register('/service-worker.js'); }
// --- PWA CONFIG END ---

export default function PedidoVajillaApp() {
  // Productos de ejemplo (id, nombre, unidad por pack, totalStock)
  const initialProducts = [
    { id: 'p1', name: 'Plato llano 27cm - Porcelana', unit: 'unidad', totalStock: 100, price: 30 },
    { id: 'p2', name: 'Plato hondo 22cm - Porcelana', unit: 'unidad', totalStock: 80, price: 28 },
    { id: 'p3', name: 'Copa vino 300ml - Cristal', unit: 'unidad', totalStock: 120, price: 40 },
    { id: 'p4', name: 'Cuchillo mesa - Acero', unit: 'unidad', totalStock: 150, price: 15 },
    { id: 'p5', name: 'Set 6 vasos - vidrio', unit: 'set (6)', totalStock: 40, price: 120 }
  ];

  // Reservas de ejemplo: cada reserva tiene fecha (YYYY-MM-DD) y items {productId, qty}
  const initialBookings = [
    { date: '2025-12-05', items: [{ productId: 'p1', qty: 40 }, { productId: 'p3', qty: 30 }] },
    { date: '2025-12-10', items: [{ productId: 'p1', qty: 20 }, { productId: 'p2', qty: 10 }] }
  ];

  const [products] = useState(initialProducts);
  const [bookings, setBookings] = useState(initialBookings);

  const [selectedDate, setSelectedDate] = useState('');
  const [availability, setAvailability] = useState({}); // { productId: availableQty }

  const [cart, setCart] = useState([]); // [{productId, qty}]
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [orderPlaced, setOrderPlaced] = useState(null);

  // Recalcula disponibilidad cada vez que cambian bookings o selectedDate
  useEffect(() => {
    computeAvailability();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookings, selectedDate]);

  function computeAvailability() {
    // Inicializar con stock total
    const avail = {};
    products.forEach(p => (avail[p.id] = p.totalStock));

    if (!selectedDate) {
      setAvailability(avail);
      return;
    }

    // Restar reservas que coincidan con la fecha
    const bookedForDate = bookings.filter(b => b.date === selectedDate);
    bookedForDate.forEach(b => {
      b.items.forEach(it => {
        if (avail[it.productId] !== undefined) {
          avail[it.productId] = Math.max(0, avail[it.productId] - it.qty);
        }
      });
    });

    setAvailability(avail);
  }

  function addToCart(productId, qty) {
    qty = Number(qty);
    if (!qty || qty <= 0) return;
    const available = availability[productId] ?? 0;
    const currentInCart = cart.find(c => c.productId === productId)?.qty ?? 0;
    if (qty + currentInCart > available) {
      alert('No hay stock suficiente para esa fecha. Ajustá la cantidad.');
      return;
    }
    setCart(prev => {
      const exists = prev.find(i => i.productId === productId);
      if (exists) {
        return prev.map(i => i.productId === productId ? { ...i, qty: i.qty + qty } : i);
      }
      return [...prev, { productId, qty }];
    });
  }

  function removeFromCart(productId) {
    setCart(prev => prev.filter(i => i.productId !== productId));
  }

  function updateCartQty(productId, qty) {
    qty = Number(qty);
    if (qty <= 0) return removeFromCart(productId);
    const available = availability[productId] ?? 0;
    if (qty > available) {
      alert('Supera el stock disponible para esa fecha.');
      return;
    }
    setCart(prev => prev.map(i => i.productId === productId ? { ...i, qty } : i));
  }

  function placeOrder() {
    if (!selectedDate) return alert('Seleccioná una fecha de retiro/entrega.');
    if (!clientName) return alert('Ingresá nombre del cliente.');
    if (cart.length === 0) return alert('El carrito está vacío.');

    // Aquí normalmente llamarías a una API que validara stock en servidor y guardara la reserva.
    // Para este ejemplo guardamos localmente en "bookings".
    const newBooking = {
      date: selectedDate,
      items: cart.map(i => ({ productId: i.productId, qty: i.qty }))
    };

    setBookings(prev => [...prev, newBooking]);

    const order = {
      id: 'ORD-' + Math.random().toString(36).slice(2, 9).toUpperCase(),
      date: selectedDate,
      clientName,
      clientPhone,
      notes,
      items: cart.map(i => ({ ...i, product: products.find(p => p.id === i.productId)?.name }))
    };

    setOrderPlaced(order);

    // Limpiar form
    setCart([]);
    setClientName('');
    setClientPhone('');
    setNotes('');

    // Recalcular disponibilidad (useEffect lo hará por cambio en bookings)
    alert('Pedido realizado: ' + order.id);
  }

  function qtyInputFor(productId) {
    const prod = products.find(p => p.id === productId);
    const available = availability[productId] ?? prod.totalStock;
    return (
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={1}
          max={available}
          placeholder={`1 - max ${available}`}
          className="w-24 border rounded px-2 py-1 text-sm"
          onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
          id={`qty-${productId}`}
        />
        <button
          className="px-3 py-1 rounded bg-black text-white text-sm hover:opacity-90"
          onClick={() => {
            const el = document.getElementById(`qty-${productId}`);
            const val = el ? Number(el.value) : 1;
            addToCart(productId, val || 1);
            if (el) el.value = '';
          }}
        >Agregar</button>
      </div>
    );
  }

  const totalPrice = cart.reduce((sum, it) => {
    const prod = products.find(p => p.id === it.productId);
    return sum + (prod?.price ?? 0) * it.qty;
  }, 0);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Pedido de Vajilla</h1>
        <div className="text-sm text-gray-600">App simple para que tus clientes pidan y vean stock por fecha</div>
      </header>

      <section className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white rounded shadow p-4">
          <label className="block text-sm font-medium mb-2">Fecha del evento / retiro</label>
          <input
            type="date"
            className="w-full border rounded px-3 py-2"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />

          <div className="mt-4 text-sm text-gray-700">
            {selectedDate ? (
              <div>Mostrando stock disponible para <strong>{selectedDate}</strong>.</div>
            ) : (
              <div>Seleccioná una fecha para ver disponibilidad.</div>
            )}
          </div>

          <div className="mt-4">
            <h3 className="font-semibold mb-2">Productos</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {products.map(p => {
                const avail = availability[p.id] ?? p.totalStock;
                return (
                  <div key={p.id} className="border rounded p-3 flex flex-col">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{p.name}</div>
                        <div className="text-sm text-gray-600">{p.unit} · ${p.price} c/u</div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm ${avail === 0 ? 'text-red-600' : 'text-gray-700'}`}>Disponible: <strong>{avail}</strong></div>
                        <div className="text-xs text-gray-500">Stock total: {p.totalStock}</div>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      {qtyInputFor(p.id)}
                      <button
                        className="px-3 py-1 border rounded text-sm"
                        onClick={() => {
                          const defaultQty = 1;
                          addToCart(p.id, defaultQty);
                        }}
                      >+ rápido</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <aside className="bg-white rounded shadow p-4">
          <h3 className="font-semibold mb-3">Carrito</h3>
          {cart.length === 0 ? (
            <div className="text-sm text-gray-500">El carrito está vacío.</div>
          ) : (
            <div className="space-y-2">
              {cart.map(it => {
                const prod = products.find(p => p.id === it.productId);
                const avail = availability[it.productId] ?? prod.totalStock;
                return (
                  <div key={it.productId} className="flex items-center justify-between gap-2">
                    <div>
                      <div className="font-medium text-sm">{prod.name}</div>
                      <div className="text-xs text-gray-500">${prod.price} · Disponible: {avail}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={avail}
                        value={it.qty}
                        onChange={(e) => updateCartQty(it.productId, e.target.value)}
                        className="w-16 border rounded px-2 py-1 text-sm"
                      />
                      <button className="text-red-600 text-sm" onClick={() => removeFromCart(it.productId)}>Eliminar</button>
                    </div>
                  </div>
                );
              })}

              <div className="pt-3 border-t">
                <div className="flex justify-between items-center">
                  <div className="font-semibold">Total</div>
                  <div className="font-bold">${totalPrice}</div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4">
            <label className="block text-xs text-gray-600">Nombre</label>
            <input type="text" className="w-full border rounded px-2 py-1 text-sm" value={clientName} onChange={e => setClientName(e.target.value)} />
            <label className="block text-xs text-gray-600 mt-2">Teléfono</label>
            <input type="text" className="w-full border rounded px-2 py-1 text-sm" value={clientPhone} onChange={e => setClientPhone(e.target.value)} />
            <label className="block text-xs text-gray-600 mt-2">Notas</label>
            <textarea className="w-full border rounded px-2 py-1 text-sm" value={notes} onChange={e => setNotes(e.target.value)} />

            <button
              className="w-full mt-3 px-4 py-2 rounded bg-green-600 text-white font-semibold hover:opacity-95"
              onClick={placeOrder}
            >Enviar pedido</button>
          </div>
        </aside>
      </section>

      <section>
        <h3 className="font-semibold mb-2">Pedidos realizados (ejemplo local)</h3>
        <div className="text-sm text-gray-700 mb-2">Estos pedidos quedan guardados en el estado local (reemplazar por base de datos o API).</div>
        <div className="grid gap-2">
          {bookings.length === 0 ? <div className="text-gray-500">No hay reservas.</div> : (
            bookings.map((b, idx) => (
              <div key={idx} className="border rounded p-3 bg-gray-50">
                <div className="text-sm">Fecha: <strong>{b.date}</strong></div>
                <div className="text-sm">Items:</div>
                <ul className="text-sm list-disc ml-5">
                  {b.items.map((it, i) => (
                    <li key={i}>{products.find(p => p.id === it.productId)?.name ?? it.productId} — {it.qty}</li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      </section>

      {orderPlaced && (
        <div className="mt-6 bg-white border-l-4 border-green-500 p-4 rounded">
          <div className="font-semibold">Pedido generado: {orderPlaced.id}</div>
          <div className="text-sm">Cliente: {orderPlaced.clientName} · Fecha: {orderPlaced.date}</div>
          <div className="text-sm mt-2">Items:</div>
          <ul className="list-disc ml-5 text-sm">
            {orderPlaced.items.map((it, i) => (
              <li key={i}>{it.product} — {it.qty}</li>
            ))}
          </ul>
        </div>
      )}

      <footer className="mt-8 text-xs text-gray-500">
        Nota: Esta es una versión de demostración. Para producción, integrar con un backend que valide stock atómico y almacene reservas.
      </footer>

      {/* INSTRUCCIONES DE INTEGRACIÓN (comentar/usar en deploy):
        1) Conectar a API REST o GraphQL para productos y reservas. Reemplazar 'initialProducts' y 'initialBookings' por llamadas a la API.
        2) Al hacer placeOrder(), llamar endpoint POST /reservas que haga una verificación de stock en el servidor (operación atómica) y devuelva confirmación o error.
        3) Manejar autenticación/CSRF y validaciones en backend.
        4) Para clientes que reservan desde la web, enviar correo/SMS de confirmación con el ID del pedido.
        5) Opcional: agregar calendario visual, carga de imágenes de productos, filtros por categoría y cálculo de costos de envío/entrega.
      */}
    </div>
  );
}
