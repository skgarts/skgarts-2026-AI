import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MediaUploader from '@/components/MediaUploader';
import WixMediaPicker from '@/components/WixMediaPicker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
              Upload new images or select from your existing Wix Site Files.
            </p>
          </div>

          <div className="flex justify-center">
            <div className="w-full max-w-3xl">
              <Tabs defaultValue="upload" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-secondary/10 p-1 rounded-lg">
                  <TabsTrigger 
                    value="upload"
                    className="font-paragraph text-sm data-[state=active]:bg-primary data-[state=active]:text-background"
                  >
                    Upload New
                  </TabsTrigger>
                  <TabsTrigger 
                    value="browse"
                    className="font-paragraph text-sm data-[state=active]:bg-primary data-[state=active]:text-background"
                  >
                    Browse Existing
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="upload" className="mt-8">
                  <MediaUploader />
                </TabsContent>

                <TabsContent value="browse" className="mt-8">
                  <WixMediaPicker />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
