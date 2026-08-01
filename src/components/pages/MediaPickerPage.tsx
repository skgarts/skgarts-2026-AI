import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WixMediaPicker from '@/components/WixMediaPicker';

export default function MediaPickerPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 w-full max-w-[100rem] mx-auto px-4 py-16">
        <div className="space-y-12">
          <div className="text-center space-y-4">
            <h1 className="font-heading text-6xl text-secondary">
              Media Manager
            </h1>
            <p className="font-paragraph text-lg text-secondary/70 max-w-2xl mx-auto">
              Select and manage images from your Wix Site Files. Click the button below to open the native Wix Media Manager interface and choose images to display.
            </p>
          </div>

          <div className="flex justify-center">
            <div className="w-full max-w-2xl">
              <WixMediaPicker />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
