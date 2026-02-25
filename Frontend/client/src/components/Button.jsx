export const Button = ({ 
  children, 
  variant = "primary", 
  size = "md", 
  className = "", 
  ...props 
}) => {
  const baseStyles = "font-bold rounded-xl transition-all duration-200 transform focus:outline-none inline-flex items-center justify-center";
  
  const variants = {
    primary: "bg-[#E60012] text-white hover:bg-[#FF1A2C] active:translate-y-0.5 shadow-lg hover:-translate-y-0.5",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300 active:translate-y-0.5 shadow-md hover:-translate-y-0.5",
    outline: "border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400",
    danger: "bg-[#E60012] text-white hover:bg-[#C4000F] active:translate-y-0.5 shadow-lg",
    success: "bg-[#7AC143] text-white hover:bg-[#5A9132] active:translate-y-0.5 shadow-lg",
    info: "bg-[#0AB5CD] text-white hover:bg-[#089AAE] active:translate-y-0.5 shadow-lg",
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-5 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
