'use client';

interface StepProgressProps {
    currentStep: number;
    steps: { label: string; description?: string }[];
}

/**
 * Progress indicator for multi-step wizards
 * Displays steps with connecting lines and completion status
 */
export function StepProgress({ currentStep, steps }: StepProgressProps) {
    return (
        <nav aria-label="Progress" className="mb-6">
            <ol className="flex items-center justify-between w-full">
                {steps.map((step, index) => {
                    const stepNumber = index + 1;
                    const isCompleted = stepNumber < currentStep;
                    const isCurrent = stepNumber === currentStep;
                    const isPending = stepNumber > currentStep;

                    return (
                        <li key={step.label} className="flex-1 flex items-center">
                            {/* Step Circle */}
                            <div className="flex flex-col items-center">
                                <div
                                    className={`
                                        flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all
                                        ${isCompleted
                                            ? 'bg-blue-600 border-blue-600 text-white'
                                            : isCurrent
                                                ? 'bg-blue-600 border-blue-600 text-white ring-4 ring-blue-100'
                                                : 'bg-gray-100 border-gray-300 text-gray-500'
                                        }
                                    `}
                                >
                                    {isCompleted ? (
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    ) : (
                                        <span className="font-semibold text-sm">{stepNumber}</span>
                                    )}
                                </div>
                                <span
                                    className={`
                                        mt-2 text-xs font-medium
                                        ${isCurrent ? 'text-blue-600' : isPending ? 'text-gray-400' : 'text-gray-600'}
                                    `}
                                >
                                    {step.label}
                                </span>
                            </div>

                            {/* Connector Line - not after last step */}
                            {index < steps.length - 1 && (
                                <div
                                    className={`
                                        flex-1 h-0.5 mx-4
                                        ${stepNumber < currentStep ? 'bg-blue-600' : 'bg-gray-200'}
                                    `}
                                />
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}

export default StepProgress;
