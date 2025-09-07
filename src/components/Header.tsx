"use client"

import { Search, User, ShoppingCart, Heart, Menu, ChevronDown, ChevronUp, X, LogOut, Package, ShoppingBag, LayoutDashboard } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Image from 'next/image';
import Link from "next/link";
import React, { useEffect, useState, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Smartphone, Laptop, Headphones, Watch, Camera, Gamepad2 } from 'lucide-react';
import { useStore } from '@/stores/useStore';
import { useRouter } from 'next/navigation';
import { debounce, DebouncedFunc } from 'lodash';
import { Product } from '@/models/Product';

export const Header = () => {
    // Data definitions
    const categories = [
        { name: 'Phones', href: '/categories/phones', icon: Smartphone },
        { name: 'Laptops', href: '/categories/laptops', icon: Laptop },
        { name: 'Headphones', href: '/categories/headphones', icon: Headphones },
        { name: 'Smart Watches', href: '/categories/smartwatches', icon: Watch },
        { name: 'Cameras', href: '/categories/cameras', icon: Camera },
        { name: 'Consoles', href: '/categories/consoles', icon: Gamepad2 },
    ];

    const mainNavLinks = [
        { name: 'Home', href: '/' },
        { name: 'About', href: '/about' },
        { name: 'Contact Us', href: '/contact-us', className: 'text-nowrap' },
        { name: 'FAQs', href: '/faq' }
    ];

    // State management
    const [isMobileProductsOpen, setIsMobileProductsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const { data: session, status } = useSession();
    const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
    const { favoritesCount, cartCount } = useStore();
    const router = useRouter();
    const searchRef = useRef<HTMLDivElement>(null);
    const profileImageUrlRef = useRef<string | null>(null);

    // Check if user is admin (you'll need to adjust this based on your user model)
    const isAdmin = session?.user?.role === 'admin' || session?.user?.email === 'admin@example.com';

    // Handle search submission
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery('');
            setShowDropdown(false);
        }
    };

    // Fetch search results with debounce (stable identity using useRef)
    // store the debounced function in a ref so its identity doesn't change
    const fetchSearchResultsRef = useRef<DebouncedFunc<(q: string) => Promise<void>> | null>(
      debounce(async (query: string) => {
        if (!query.trim()) {
          setSearchResults([]);
          setShowDropdown(false);
          return;
        }

        setIsSearching(true);
        try {
          const response = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`);
          if (!response.ok) throw new Error('Failed to fetch');
          const data = await response.json();
          setSearchResults(data);
          setShowDropdown(data.length > 0);
        } catch (error) {
          console.error('Search failed:', error);
          setSearchResults([]);
          setShowDropdown(false);
        } finally {
          setIsSearching(false);
        }
      }, 300)
    );

    useEffect(() => {
        // capture the current debounced function value so the cleanup closes over a stable reference
        const debounced = fetchSearchResultsRef.current;
        if (!debounced) return;

        debounced(searchQuery);

        // use the captured `debounced` in cleanup to avoid referencing `ref.current` there.
        return () => {
            debounced.cancel();
        };
    }, [searchQuery]);

    // Handle click outside to close dropdown
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Clear search
    const clearSearch = () => {
        setSearchQuery('');
        setSearchResults([]);
        setShowDropdown(false);
    };

    // Effects for user profile image
    useEffect(() => {
        const fetchProfileImage = async () => {
            if (!session?.user) {
                setProfileImageUrl(null);
                return;
            }

            try {
                // Use the same approach as the profile page
                const timestamp = Date.now();
                const response = await fetch(`/api/user/image?t=${timestamp}`);

                if (response.ok) {
                    const blob = await response.blob();
                    const url = URL.createObjectURL(blob);

                    // Clean up previous blob URL if exists
                    if (profileImageUrlRef.current) {
                        URL.revokeObjectURL(profileImageUrlRef.current);
                    }

                    profileImageUrlRef.current = url;
                    setProfileImageUrl(url);
                } else if (session.user.image) {
                    // Fallback to OAuth image if available
                    setProfileImageUrl(session.user.image);
                } else {
                    throw new Error('No image found');
                }
            } catch {
                setProfileImageUrl(null);
            }
        };

        fetchProfileImage();

        // Clean up function
        return () => {
            if (profileImageUrlRef.current) {
                URL.revokeObjectURL(profileImageUrlRef.current);
            }
        };
    }, [session]);

    // Handle sign out
    const handleSignOut = () => {
        signOut({ callbackUrl: '/' });
    };

    // Components
    const renderUserProfile = () => {
        if (status === 'loading') {
            return (
                <div className='flex gap-2 items-center'>
                    <Skeleton className="h-[32px] w-[32px] rounded-full" />
                    <Skeleton className="h-[20px] w-[65px] rounded-full" />
                </div>
            );
        }

        if (session) {
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <div className="flex items-center gap-2 cursor-pointer">
                            {profileImageUrl ? (
                                <Image
                                    src={profileImageUrl}
                                    alt="Profile"
                                    width={32}
                                    height={32}
                                    className="w-8 h-8 rounded-full object-cover"
                                    onError={() => setProfileImageUrl(null)}
                                />
                            ) : (
                                <div className="bg-purple-400 rounded-full w-8 h-8 flex items-center justify-center text-white">
                                    {session.user?.name?.charAt(0) || session.user?.email?.charAt(0) || '?'}
                                </div>
                            )}
                            <span className="hidden md:inline">
                                {session.user?.name || session.user?.email?.split('@')[0]}
                            </span>
                            <ChevronDown size={16} className="hidden md:inline" />
                        </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href="/profile" className="flex items-center cursor-pointer">
                                <User className="mr-2 h-4 w-4" />
                                <span>Profile</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/orders" className="flex items-center cursor-pointer">
                                <ShoppingBag className="mr-2 h-4 w-4" />
                                <span>My Orders</span>
                            </Link>
                        </DropdownMenuItem>

                        {/* Admin options */}
                        {isAdmin && (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel>Admin</DropdownMenuLabel>
                                <DropdownMenuItem asChild>
                                    <Link href="/admin/orders" className="flex items-center cursor-pointer">
                                        <Package className="mr-2 h-4 w-4" />
                                        <span>Orders</span>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/admin/products" className="flex items-center cursor-pointer">
                                        <LayoutDashboard className="mr-2 h-4 w-4" />
                                        <span>Products</span>
                                    </Link>
                                </DropdownMenuItem>
                            </>
                        )}

                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                            className="flex items-center cursor-pointer text-red-600 focus:text-red-600"
                            onSelect={handleSignOut}
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Sign out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        }

        return (
            <Link href="/auth/signin">
                <User />
            </Link>
        );
    };

    const renderCartFavorites = (isMobile = false) => (
        <>
            <Link href="/favorites" className='relative'>
                <Heart />
                {favoritesCount > 0 && (
                    <span className={`absolute -top-3 -right-3 bg-red-500 text-xs text-white rounded-full h-5 w-5 flex items-center justify-center shadow ${isMobile ? '' : ''}`}>
                        {favoritesCount}
                    </span>
                )}
            </Link>

            <Link href="/cart" className="relative">
                <ShoppingCart />
                {cartCount > 0 && (
                    <span className={`absolute -top-3 -right-3 bg-red-500 text-xs text-white rounded-full h-5 w-5 flex items-center justify-center shadow ${isMobile ? '' : ''}`}>
                        {cartCount}
                    </span>
                )}
            </Link>
        </>
    );

    const renderSearchDropdown = () => (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-50 mt-1 max-h-96 overflow-y-auto">
            {isSearching ? (
                <div className="p-4 text-center">Searching...</div>
            ) : searchResults.length === 0 ? (
                <div className="p-4 text-center">No products found</div>
            ) : (
                <ul>
                    {searchResults.map((product) => (
                        <li key={product.slug} className="border-b border-gray-100 last:border-0">
                            <Link 
                                href={`/products/${product.slug}`} 
                                className="flex items-center p-2 hover:bg-gray-50"
                                onClick={clearSearch}
                            >
                                <div className="flex-shrink-0 w-10 h-10 rounded overflow-hidden">
                                    {product.imageUrls?.length > 0 && (
                                        <Image 
                                            src={product.imageUrls[0]} 
                                            alt={product.name}
                                            width={40}
                                            height={40}
                                            className="object-contain w-full h-full"
                                        />
                                    )}
                                </div>
                                <div className="ml-3 flex-1 min-w-0">
                                    <div className="text-sm font-medium text-gray-900 truncate">{product.name}</div>
                                    <div className="flex justify-between">
                                        <div className="text-sm text-gray-500">{product.brand}</div>
                                        <div className="text-sm font-semibold">${product.price.toFixed(2)}</div>
                                    </div>
                                </div>
                            </Link>
                        </li>
                    ))}
                    <li className="text-center py-2 border-t border-gray-100">
                        <Link 
                            href={`/search?q=${encodeURIComponent(searchQuery)}`} 
                            className="text-blue-600 hover:underline font-medium"
                            onClick={clearSearch}
                        >
                            View all results
                        </Link>
                    </li>
                </ul>
            )}
        </div>
    );

    const renderMobileSidebar = () => (
        <Sheet>
            <SheetTrigger><Menu /></SheetTrigger>
            <SheetContent side={'left'}>
                <SheetHeader>
                    <SheetTitle>Menu</SheetTitle>
                    <form onSubmit={handleSearch} className='flex gap-2 bg-gray-100 h-[50px] rounded items-center mb-4'>
                        <button type="submit">
                            <Search size={18} color='gray' className='ml-4' />
                        </button>
                        <input
                            className='text-sm w-[70%] text-gray-600 outline-none bg-transparent'
                            type="text"
                            placeholder='Search'
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button type="button" onClick={clearSearch} className="mr-2">
                                <X size={18} color='gray' />
                            </button>
                        )}
                    </form>

                    <div className='flex gap-8 items-center justify-center mb-4'>
                        {renderCartFavorites(true)}
                        {session ? (
                            <Link href="/profile">
                                <div className="flex items-center gap-2 cursor-pointer">
                                    {profileImageUrl ? (
                                        <Image
                                            src={profileImageUrl}
                                            alt="Profile"
                                            width={32}
                                            height={32}
                                            className="w-8 h-8 rounded-full object-cover"
                                            onError={() => setProfileImageUrl(null)}
                                        />
                                    ) : (
                                        <div className="bg-purple-400 rounded-full w-8 h-8 flex items-center justify-center text-white">
                                            {session.user?.name?.charAt(0) || session.user?.email?.charAt(0) || '?'}
                                        </div>
                                    )}
                                </div>
                            </Link>
                        ) : (
                            <Link href="/auth/signin">
                                <User />
                            </Link>
                        )}
                    </div>

                    <div className='flex flex-col gap-4 items-start'>
                        <div className="w-full">
                            <button
                                className="flex justify-between items-center w-full"
                                onClick={() => setIsMobileProductsOpen(!isMobileProductsOpen)}
                            >
                                <h3>Products</h3>
                                <span>{isMobileProductsOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</span>
                            </button>

                            {isMobileProductsOpen && (
                                <div className="pl-4 pt-2 w-full flex flex-col gap-2">
                                    {categories.map((category) => (
                                        <Link
                                            key={category.name}
                                            href={category.href}
                                            className="flex items-center gap-2 py-1 text-sm"
                                        >
                                            <category.icon size={16} />
                                            <span>{category.name}</span>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        {mainNavLinks.map((link) => (
                            <Link key={link.name} href={link.href}>
                                <h3 className={link.className || ''}>{link.name}</h3>
                            </Link>
                        ))}

                        {session && (
                            <>
                                <Link href="/orders">
                                    <h3>My Orders</h3>
                                </Link>
                                
                                {isAdmin && (
                                    <>
                                        <Link href="/admin/orders">
                                            <h3>Admin Orders</h3>
                                        </Link>
                                        <Link href="/admin/products">
                                            <h3>Admin Products</h3>
                                        </Link>
                                    </>
                                )}
                                
                                <button 
                                    onClick={handleSignOut}
                                    className="text-red-600 flex items-center gap-2"
                                >
                                    <LogOut size={16} />
                                    <span>Sign out</span>
                                </button>
                            </>
                        )}
                    </div>
                </SheetHeader>
            </SheetContent>
        </Sheet>
    );

    return (
        <header>
            <div className="w-full bg-white h-20 flex justify-around items-center px-4 max-lg:justify-between">
                <Link href="/">
                    <Image
                        src={'/NG.jpg'}
                        alt='NG Logo'
                        width={980}
                        height={980}
                        priority
                        className='w-[50px] h-[50px] rounded'
                    />
                </Link>

                {/* Desktop Search */}
                <div className="relative max-lg:hidden" ref={searchRef}>
                    <form onSubmit={handleSearch} className='flex gap-2 bg-gray-100 w-[300px] h-[50px] rounded items-center'>
                        <button type="submit">
                            <Search size={18} color='gray' className='ml-4' />
                        </button>
                        <input
                            className='text-sm text-gray-600 w-[240px] outline-none bg-transparent'
                            type="text"
                            placeholder='Search products...'
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => searchQuery && setShowDropdown(true)}
                        />
                        {searchQuery && (
                            <button type="button" onClick={clearSearch} className="mr-2">
                                <X size={18} color='gray' />
                            </button>
                        )}
                    </form>
                    {showDropdown && renderSearchDropdown()}
                </div>

                <div className='flex gap-11 items-center justify-center w-[400px] max-lg:hidden'>
                    {mainNavLinks.map((link) => (
                        <Link key={link.name} href={link.href}>
                            <h3 className={link.className || ''}>{link.name}</h3>
                        </Link>
                    ))}
                </div>

                <div className='flex gap-8 max-lg:hidden items-center'>
                    {renderCartFavorites()}
                    {renderUserProfile()}
                </div>

                <div className="lg:hidden">
                    {renderMobileSidebar()}
                </div>
            </div>

            <div className='flex items-center justify-around bg-[#2E2E2E] text-gray-400 py-3 px-24 text-sm max-lg:hidden'>
                {categories.map((category, index) => (
                    <React.Fragment key={category.name}>
                        <Link className='flex gap-2 items-center' href={category.href}>
                            <category.icon size={18} />
                            <h3>{category.name}</h3>
                        </Link>
                        {index < categories.length - 1 && <span className="mx-2">|</span>}
                    </React.Fragment>
                ))}
            </div>
        </header>
    )
}
