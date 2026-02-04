import { Card } from "./ui/card";
import TopBar from "./top-bar";
import TestFileTreeSecond from "./tree-view";
import Overview from "./overview-tab";

interface AnalyticsProps {
  setWhichField: React.Dispatch<React.SetStateAction<boolean>>;
}

const Analytics: React.FC<AnalyticsProps> = ({ setWhichField }) => {
  // For shrinking window size have it at h-screen and overflow hidden since the main container
  // overflow-hidden will prevent parent container scroll bar

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-stone-800">

    <TopBar onHomeClick={() => setWhichField(true)}></TopBar>

      <main className="flex-1 flex min-h-0">
        <div className="flex flex-col w-full gap-1 pt-.5 pb-1 pl-1 pr-1 min-h-0">

          <div className="flex flex-1 gap-1 min-h-0">
            <Card className="flex-[3] min-h-0 min-w-0 p-1 overflow-hidden">
                <TestFileTreeSecond/>
            </Card>

            <div className="flex-1 flex flex-col gap-1 min-w-[200px]">
              <Card className="flex-1 min-h-[200px] min-w-[150px] p-3 overflow-auto">
              <Overview></Overview>
              </Card>
              <Card className="flex-1 min-h-0 p-3 overflow-auto">
                {/* <ChartAreaInteractive></ChartAreaInteractive> */}
                {/* <NotificationCenter></NotificationCenter> */}
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Analytics;
