import { useState, useEffect } from 'react';
import { fetchMenu } from '../services/api';
import MenuItemCard from '../components/MenuItemCard';

const categories = ['All', 'Appetizers', 'Main Course', 'Pizza & Pasta', 'Desserts', 'Beverages'];

export default function Menu() {
  const [menuItems, setMenuItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMenu = async () => {
      try {
        const data = await fetchMenu();
        // Use data directly - backend already cleans names
        const cleanedData = data;
        setMenuItems(cleanedData);
        setFilteredItems(cleanedData);
      } catch (error) {
        console.error('Failed to load menu:', error);
      } finally {
        setLoading(false);
      }
    };
    loadMenu();
  }, []);

  useEffect(() => {
    let filtered = menuItems;

    if (selectedCategory !== 'All') {
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredItems(filtered);
  }, [selectedCategory, searchQuery, menuItems]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-stone-600 text-lg">Loading menu...</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-amber-50 to-stone-50 px-4 py-8 md:py-12 min-h-full">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10 md:mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-stone-800 mb-3">Our Menu</h1>
          <p className="text-lg text-stone-600 mb-8">Discover our delicious selection of dishes</p>
          
          <div className="mb-6">
            <div className="relative max-w-md">
              <input
                type="text"
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-transparent bg-white text-stone-800"
              />
              <svg
                className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-stone-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-3">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-5 py-2.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === category
                    ? 'bg-stone-800 text-amber-50'
                    : 'bg-white text-stone-700 border border-stone-300 hover:bg-stone-50'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
          {filteredItems.map((item) => (
            <MenuItemCard key={item.id} item={item} />
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-16">
            <p className="text-stone-600 text-lg">No items found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}

