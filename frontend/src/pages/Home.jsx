import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-stone-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-4xl w-full text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-stone-800 mb-6 tracking-tight">
          Delicious Bites
        </h1>
        <p className="text-xl md:text-2xl text-stone-600 mb-4 max-w-2xl mx-auto leading-relaxed">
          Experience exceptional dining with our carefully crafted menu
        </p>
        <p className="text-lg text-stone-500 mb-12 max-w-xl mx-auto">
          From fresh appetizers to decadent desserts, we bring you the finest flavors
          with dine-in, delivery, and pick-up options.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => navigate('/signup')}
            className="bg-stone-800 text-amber-50 px-10 py-4 rounded-lg text-lg font-medium hover:bg-stone-700 transition-colors shadow-lg hover:shadow-xl w-full sm:w-auto"
          >
            Login as User
          </button>
          <button
            onClick={() => navigate('/staff/login')}
            className="bg-amber-600 text-white px-10 py-4 rounded-lg text-lg font-medium hover:bg-amber-700 transition-colors shadow-lg hover:shadow-xl w-full sm:w-auto"
          >
            Login as Staff / Manager
          </button>
        </div>
      </div>
    </div>
  );
}

