import { Button } from "@/components/ui/button";
import logoSvg from "@/assets/logo.svg";
import { NavMenu } from "./nav-menu";
import { NavigationSheet } from "./navigation-sheet";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthUserProvider";
import { signOut } from "@/auth/auth";

const Navbar01Page = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    // onAuthStateChanged will clear the user in context,
    // now push back to home (or wherever you like)
    navigate("/");
  };

  return (
    <nav className="h-16 bg-background border-b">
      <div className="h-full flex items-center justify-between max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center">
          <img 
              src={logoSvg} 
              alt="Logo" 
              width="50" 
              height="50"
              className="text-foreground" // Preserves the color styling
            />
        </Link>

        {/* Desktop Menu */}
        <NavMenu className="hidden md:block" />

        <div className="flex items-center gap-3">
          {/* if no user, show Sign In / Get Started */}
          {!user ? (
            <>
              <Link to="/login">
                <Button variant="outline" className="hidden sm:inline-flex">
                  Sign In
                </Button>
              </Link>
              <Link to="/signup">
                <Button className="hidden sm:inline-flex">Get Started</Button>
              </Link>
            </>
          ) : (
            /* if there is a user, show Sign Out */
            <Button
              variant="ghost"
              className="hidden sm:inline-flex"
              onClick={handleSignOut}
            >
              Sign Out
            </Button>
          )}

          {/* Mobile Menu */}
          <div className="md:hidden">
            <NavigationSheet />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar01Page;
