import { useNavigate } from 'react-router-dom';
import { useServiceMode } from '../context/ServiceModeContext';

export default function ServiceModeSelection() {
  const navigate = useNavigate();
  const { setServiceMode } = useServiceMode();

  const handleSelectMode = (mode) => {
    setServiceMode(mode);
    if (mode === 'dine-in') {
      navigate('/reservation');
    } else {
      navigate('/menu');
    }
  };

  const modes = [
    {
      id: 'dine-in',
      title: 'Dine-In',
      description: 'Enjoy your meal in our cozy restaurant',
      icon: '🍴',
      color: 'from-amber-100 to-amber-50',
      borderColor: 'border-amber-200',
      hoverColor: 'hover:border-amber-400',
    },
    {
      id: 'delivery',
      title: 'Delivery',
      description: 'Get your favorite dishes delivered to your door',
      icon: '🚚',
      color: 'from-stone-100 to-stone-50',
      borderColor: 'border-stone-200',
      hoverColor: 'hover:border-stone-400',
    },
    {
      id: 'pick-up',
      title: 'Pick-Up',
      description: 'Order ahead and pick up at your convenience',
      icon: '📦',
      color: 'from-amber-100 to-amber-50',
      borderColor: 'border-amber-200',
      hoverColor: 'hover:border-amber-400',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-stone-50 px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-stone-800 mb-4">
            How would you like to order?
          </h1>
          <p className="text-lg text-stone-600">
            Choose your preferred service option
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {modes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => handleSelectMode(mode.id)}
              className={`bg-gradient-to-br ${mode.color} border-2 ${mode.borderColor} ${mode.hoverColor} rounded-2xl p-8 text-center transition-all hover:shadow-xl hover:scale-105`}
            >
              <div className="text-6xl mb-4">{mode.icon}</div>
              <h2 className="text-2xl font-bold text-stone-800 mb-3">{mode.title}</h2>
              <p className="text-stone-600">{mode.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

