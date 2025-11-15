import { useCart } from '../context/CartContext';
import { cleanMenuItemName } from '../utils/nameCleaner';

export default function MenuItemCard({ item }) {
  const { addToCart } = useCart();
  // ✅ BRUTAL FIX: Remove ALL digits from name
  const cleanName = cleanMenuItemName(item.name);
  
  // DEBUG: Always log first 3 items to verify
  if (item.id <= 3) {
    console.log(`[MenuItemCard ${item.id}]`, {
      original: item.name,
      cleaned: cleanName,
      hasZero: item.name?.includes('0'),
      cleanHasZero: cleanName?.includes('0')
    });
  }

  const handleAddToCart = () => {
    addToCart({
      id: item.id,
      name: cleanName,
      priceEGP: item.priceEGP,
      image: item.image,
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden hover:shadow-lg transition-all hover:scale-[1.02]">
      <div className="relative">
        <img
          src={item.image}
          alt={cleanName}
          className="w-full h-48 md:h-56 object-cover"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/400x300/f5f5dc/8b7355?text=Delicious+Bites';
          }}
        />
        {item.popular && (
          <div className="absolute top-3 right-3 bg-amber-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 shadow-md">
            <span>⭐</span>
            <span>Popular</span>
          </div>
        )}
      </div>
      <div className="p-5">
        <div className="mb-2">
          <h3 className="text-lg font-semibold text-stone-800 mb-1 flex items-center gap-1">
            {cleanName}
            {item.spicy > 0 &&
              Array.from({ length: item.spicy }).map((_, i) => (
                <span key={i} className="text-red-500 text-sm" title={`Spicy Level ${item.spicy}`}>
                  🔥
                </span>
              ))}
          </h3>
        </div>
        <p className="text-sm text-stone-600 mb-4 leading-relaxed line-clamp-2">{item.description}</p>
        {item.dietary && item.dietary.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {item.dietary.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 bg-amber-50 text-stone-700 text-xs rounded-full border border-amber-100"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between pt-2 border-t border-stone-100">
          <span className="text-xl font-bold text-stone-800">
            EGP {item.priceEGP.toFixed(2)}
          </span>
          <button
            onClick={handleAddToCart}
            className="bg-stone-800 text-amber-50 px-5 py-2.5 rounded-lg hover:bg-stone-700 transition-colors text-sm font-medium"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}

