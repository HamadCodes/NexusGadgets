import { Twitter, Facebook, Linkedin, Instagram } from 'lucide-react';
import Image from 'next/image';


export const Footer = () => {
    return (
        <footer className="w-full h-[500px] bg-black text-white flex gap-40 items-center justify-center max-lg:flex-col max-lg:h-auto max-lg:text-center px-6 max-lg:gap-10 max-lg:py-10">

            <div>
                <Image
                    src={'/NG.jpg'}
                    alt='NG Logo' 
                    width={980}
                    height={980}
                    priority
                    className='w-[100px] h-[100px] max-lg:m-auto'
                />
                <p className="text-xs w-2/3 mb-24 max-lg:w-auto max-lg:mb-0 max-lg:px-2">We are a online technology store. We offer all kinds of phones and PCs.</p>

                <div className="flex gap-5 max-lg:hidden">
                    <Twitter size={15} />
                    <Facebook size={15} />
                    <Linkedin size={15} />
                    <Instagram size={15} />
                </div>

            </div>

            <div className="flex flex-col gap-6">
                <h2 className='font-bold'>Services</h2>
                <p className="text-xs text-">Bonus program</p>
                <p className="text-xs">Gift cards</p>
                <p className="text-xs">Credit and payment</p>
                <p className="text-xs">Service contracts</p>
                <p className="text-xs">Non-cash account</p>
                <p className="text-xs">Payment</p>
            </div>

            <div className="flex flex-col gap-6">
                <h2 className='font-bold'>Assistance to the buyer</h2>
                <p className="text-xs">Find an order</p>
                <p className="text-xs">Terms of delivery</p>
                <p className="text-xs">Exchange and return of goods</p>
                <p className="text-xs">Guarantee</p>
                <p className="text-xs">Frequently asked questions</p>
                <p className="text-xs">Terms of use of the site</p>
            </div>

            <div className="lg:hidden flex gap-5">
                <Twitter size={18} />
                <Facebook size={18} />
                <Linkedin size={18} />
                <Instagram size={18} />
            </div>
        </footer>
    )
}
