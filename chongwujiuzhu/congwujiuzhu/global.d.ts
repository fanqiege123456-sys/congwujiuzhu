// WeChat Mini Program global types
declare global {
  const wx: any;
  const App: any;
  const Page: any;
  const Component: any;
  
  function getApp(): any;
  function getCurrentPages(): any[];
}

export {};
