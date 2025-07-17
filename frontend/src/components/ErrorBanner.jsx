import {motion, AnimatePresence} from 'framer-motion';
import {ExclamationTriangleIcon, XMarkIcon} from '@heroicons/react/24/outline';

const ErrorBanner = ({message, onClose}) => (
    <AnimatePresence>
        {message && (
            <motion.div
                initial={{opacity: 0, y: 20}}
                animate={{opacity: 1, y: 0}}
                exit={{opacity: 0, y: 20}}
                transition={{duration: 0.3}}
                className="fixed bottom-[90px] inset-x-0 flex justify-center z-50 pointer-events-none"
                style={{paddingBottom: 'env(safe-area-inset-bottom)'}}
            >
                <div className="max-w-screen-md w-full mx-4 pointer-events-auto">
                    <div
                        className="bg-neutral-900/60 backdrop-blur-md border border-red-600 text-red-200 px-4 py-3 rounded-xl flex items-center shadow-lg">
                        <ExclamationTriangleIcon className="h-6 w-6 flex-shrink-0 text-red-500 mr-2"/>
                        <div className="flex-1 text-sm font-medium">
                            {message}
                        </div>
                        <button onClick={onClose} aria-label="Dismiss"
                                className="ml-2 hover:bg-neutral-800/70 p-1 rounded">
                            <XMarkIcon className="h-5 w-5 text-red-500"/>
                        </button>
                    </div>
                </div>
            </motion.div>
        )}
    </AnimatePresence>
);

export default ErrorBanner;
