import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { NavigationMenuProps } from "@radix-ui/react-navigation-menu";
import { Link } from "react-router-dom";

export const NavMenu = (props: NavigationMenuProps) => (
  <NavigationMenu {...props}>
    <NavigationMenuList className="gap-6 space-x-0 data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-start">
      {/* <NavigationMenuItem>
        <NavigationMenuLink asChild>
          <Link to="/lessons" className="text-sm hover:underline">Lessons</Link>
        </NavigationMenuLink>
      </NavigationMenuItem> */}
    </NavigationMenuList>
  </NavigationMenu>
);
