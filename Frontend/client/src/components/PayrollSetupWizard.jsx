import { useState } from "react";
import { Button } from "./Button";
import { useToast } from "./Toast";
import { Check, ArrowRight, Settings, Users, Calculator } from "lucide-react";
import storeService from "../services/storeService";

export const PayrollSetupWizard = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [setupData, setSetupData] = useState({
    epf_rate: "8",
    etf_rate: "3",
    tax_threshold: "100000",
    tax_rate: "5",
    allowances: "Transport,Meals",
    deductions: "Loan Repayment,Late Fine"
  });
  const toast = useToast();

  const handleNext = () => setStep(prev => prev + 1);
  const handlePrev = () => setStep(prev => prev - 1);

  const handleComplete = async () => {
    try {
      toast.success("Saving payroll settings...");
      // Save settings via storeService
      await storeService.update({
        payroll_epf_rate: setupData.epf_rate,
        payroll_etf_rate: setupData.etf_rate,
        payroll_tax_rate: setupData.tax_rate,
        payroll_allowances: setupData.allowances,
        payroll_deductions: setupData.deductions,
        payroll_setup_complete: "true"
      });

      toast.success("Payroll setup completed successfully!");
      onComplete();
    } catch (err) {
      toast.error(err.message || "Failed to save setup data");
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50 p-6">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-2xl w-full p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#E60012]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Calculator className="w-8 h-8 text-[#E60012]" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">Payroll Setup Wizard</h2>
          <p className="text-gray-500 mt-2">Let's configure your standard salary rules and taxes before you process your first payroll.</p>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                step === i ? "bg-[#E60012] text-white" : step > i ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"
              }`}>
                {step > i ? <Check className="w-4 h-4" /> : i}
              </div>
              {i < 3 && (
                <div className={`w-16 h-1 mx-2 rounded-full ${step > i ? "bg-green-500" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="space-y-6 min-h-[250px]">
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-gray-500" /> Statutory Deductions
              </h3>
              <p className="text-gray-500 text-sm mb-6">Set the default rates for provident funds and taxes.</p>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">EPF Rate (%)</label>
                  <input
                    type="number"
                    value={setupData.epf_rate}
                    onChange={(e) => setSetupData({...setupData, epf_rate: e.target.value})}
                    className="nintendo-input"
                  />
                  <p className="text-xs text-gray-400 mt-1">Employee Provident Fund</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">ETF Rate (%)</label>
                  <input
                    type="number"
                    value={setupData.etf_rate}
                    onChange={(e) => setSetupData({...setupData, etf_rate: e.target.value})}
                    className="nintendo-input"
                  />
                  <p className="text-xs text-gray-400 mt-1">Employee Trust Fund</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Income Tax Rate (%)</label>
                  <input
                    type="number"
                    value={setupData.tax_rate}
                    onChange={(e) => setSetupData({...setupData, tax_rate: e.target.value})}
                    className="nintendo-input"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-500" /> Standard Allowances & Deductions
              </h3>
              <p className="text-gray-500 text-sm mb-6">Define the default components that apply to employee salaries. (Comma-separated)</p>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Default Allowances</label>
                  <input
                    type="text"
                    value={setupData.allowances}
                    onChange={(e) => setSetupData({...setupData, allowances: e.target.value})}
                    className="nintendo-input"
                    placeholder="e.g. Transport, Meals, Attendance Bonus"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Default Deductions</label>
                  <input
                    type="text"
                    value={setupData.deductions}
                    onChange={(e) => setSetupData({...setupData, deductions: e.target.value})}
                    className="nintendo-input"
                    placeholder="e.g. Loan Repayment, Late Fine"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-green-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">You're all set!</h3>
              <p className="text-gray-500 mb-6">Your payroll calculation engine is now configured with your custom rules.</p>
              
              <div className="bg-gray-50 rounded-xl p-4 text-left inline-block w-full max-w-sm">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-500">EPF/ETF:</span>
                  <span className="font-bold text-gray-900">{setupData.epf_rate}% / {setupData.etf_rate}%</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-500">Tax Rate:</span>
                  <span className="font-bold text-gray-900">{setupData.tax_rate}%</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
          <Button 
            variant="outline" 
            onClick={handlePrev} 
            disabled={step === 1}
            className={step === 1 ? "invisible" : ""}
          >
            Back
          </Button>
          
          {step < 3 ? (
            <Button onClick={handleNext}>
              Continue <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleComplete} className="bg-green-500 hover:bg-green-600">
              <Check className="w-4 h-4 mr-2" /> Complete Setup
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PayrollSetupWizard;
