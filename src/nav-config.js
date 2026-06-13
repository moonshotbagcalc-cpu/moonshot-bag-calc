import CurvedPanelPage from "./tabs/CurvedPanel.jsx";
import GussetPage from "./tabs/Gusset.jsx";
import TaperedPanelsPage from "./tabs/TaperedPanels.jsx";
import ShapedBottomsPage from "./tabs/ShapedBottoms.jsx";
import BoxedBottomsPage from "./tabs/BoxedBottoms.jsx";
import FoldedBottomsPage from "./tabs/FoldedBottoms.jsx";
import PipingPage from "./tabs/Piping.jsx";
import AccordionPocketPage from "./tabs/AccordionPocket.jsx";
import ZipperPocketPage from "./tabs/ZipperPocket.jsx";
import WeltPocketPage from "./tabs/WeltPocket.jsx";
import HandlesStrapsPage from "./tabs/HandlesStraps.jsx";
import PurseFeetPage from "./tabs/PurseFeet.jsx";
import RivetGuidesPage from "./tabs/RivetGuides.jsx";
import ZipperPouchPage from "./tabs/ZipperPouch.jsx";
import GroceryTotePage from "./tabs/GroceryTote.jsx";

// Data-driven nav: adding a tab = one entry here (plus its file in src/tabs/).
export const NAV_GROUPS = [
  {
    id:"sides-panels", label:"Sides & Panels", color:"#9a3e52",
    pages:[
      {id:"curved-panel", label:"Curved Panels", color:"#7a1a2e", component:CurvedPanelPage},
      {id:"gusset", label:"Gussets", color:"#1a6e3a", component:GussetPage},
      {id:"tapered-panels", label:"Tapered Panels", color:"#b06a4a", component:TaperedPanelsPage, coming:true},
    ],
  },
  {
    id:"bottoms", label:"Bottoms", color:"#7658b3",
    pages:[
      {id:"shaped-bottoms", label:"Shaped Bottoms", color:"#5a2da0", component:ShapedBottomsPage},
      {id:"boxed-bottoms", label:"Boxed Bottoms", color:"#a84f14", component:BoxedBottomsPage},
      {id:"folded-bottoms", label:"Folded Bottoms", color:"#9a4968", component:FoldedBottomsPage, coming:true},
    ],
  },
  {
    id:"trims-pockets", label:"Trims & Pockets", color:"#356b9b",
    pages:[
      {id:"piping", label:"Piping", color:"#8e1a9e", component:PipingPage},
      {id:"accordion", label:"Accordion Pocket", color:"#1a4a7a", component:AccordionPocketPage},
      {id:"zipper-pocket", label:"Zipper Pocket", color:"#176b78", component:ZipperPocketPage, coming:true},
      {id:"welt-pocket", label:"Welt Pocket", color:"#3a5c99", component:WeltPocketPage, coming:true},
    ],
  },
  {
    id:"handles-hardware", label:"Handles & Hardware", color:"#8a6d3a",
    pages:[
      {id:"handles-straps", label:"Handles & Straps", color:"#8a6d3a", component:HandlesStrapsPage, coming:true},
      {id:"purse-feet", label:"Purse Feet Placement", color:"#a67c3a", component:PurseFeetPage, coming:true},
      {id:"rivet-guides", label:"Rivet Guides", color:"#6b5a4a", component:RivetGuidesPage, coming:true},
    ],
  },
  {
    id:"complete-bags", label:"Complete Bags", color:"#1d6b5a",
    pages:[
      {id:"zipper-pouch", label:"Two Panel Zipper Pouch", color:"#2a6b8a", component:ZipperPouchPage, coming:true},
      {id:"grocery-tote", label:"Grocery Tote", color:"#3a8a5a", component:GroceryTotePage, coming:true},
    ],
  },
];

export function navGroupForPage(pageId) {
  return NAV_GROUPS.find(group => group.pages.some(item => item.id === pageId)) || NAV_GROUPS[0];
}
