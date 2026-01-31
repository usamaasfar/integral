import { Button } from "~/renderer/components/ui/button";

const Welcome = () => {
  return (
    <div className="h-full flex flex-col items-center justify-center">
      <div className="w-lg">
        <div className="text-center flex flex-col gap-4">
          <p className="text-4xl font-bold">Integral</p>
          <p className="">
            Commodo aliqua exercitation proident officia est nulla duis Lorem pariatur ipsum. Commodo aliqua exercitation proident officia
            est nulla duis Lorem pariatur ipsum.
          </p>
        </div>

        <div className="mt-24">
          <Button size="lg" className="w-full">
            Get Started
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
