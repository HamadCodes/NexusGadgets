import { Button } from "@/components/ui/button"
import Image from "next/image"

export const Herosection = () => {
    return (
        <section>
            <div className="bg-[#211C24] text-white flex items-center justify-center gap-20 px-20 max-lg:flex-col max-lg:px-4 max-lg:gap-3">

                <div className="max-lg:text-center max-lg:mt-20">
                    <p className="text-gray-400">Pro.Beyond.</p>
                    <h1 className="text-8xl max-lg:text-5xl"><span className="font-[50]">IPhone 14</span> <span className="font-bold">Pro</span></h1>
                    <p className="text-gray-400 mb-5">Created to change everything for the better. For everyone</p>
                    <Button variant='ghost' className="border border-white py-6 px-10">Shop Now</Button>
                </div>

                <div className="">
                    <Image
                        src="/Iphone.png"
                        alt="Iphone 14 Pro"
                        width={406}
                        height={632}
                        priority
                        quality={100}
                        className="object-contain w-full h-auto max-w-[350px]"
                    />
                </div>


            </div>


            {/*Product Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 w-full max-xl:hidden">
                <div className="flex flex-col">
                    <div className="h-[300px] bg-white flex items-center justify-between">
                        <Image
                            src="/PlayStation.png"
                            alt="PlayStation"
                            width={360}
                            height={328}
                            priority
                            quality={100}
                            className="object-contain w-auto h-full"
                        />
                        <div className="flex flex-col gap-4 mr-12">
                            <h2 className="text-4xl font-bold">PlayStation 5</h2>
                            <p className="text-gray-400 text-xs max-w-[350px]">Incredibly powerful CPUs, GPUs, and an SSD with integrated I/O will redefine your PlayStation experience.</p>
                        </div>
                    </div>

                    <div className="flex h-[300px] max-lg:h-auto max-lg:flex-col max-md:hidden">
                        <div className="w-1/2 max-lg:w-full bg-[#EDEDED] flex items-center justify-between">
                            <Image
                                src="/AirPodsMax.png"
                                alt="AirPodsMax"
                                width={104}
                                height={272}
                                priority
                                quality={100}
                                className="object-contain w-auto h-full"
                            />
                            <div className="flex flex-col gap-4 w-2/6 mr-12">
                                <h2 className="text-3xl font-[100]">Apple AirPods <span className="font-bold">Max</span></h2>
                                <p className="text-gray-400 text-xs">Computational audio. Listen, it is powerful.</p>
                            </div>
                        </div>
                        <div className="w-1/2 max-lg:w-full bg-[#353535] flex items-center justify-between">
                            <Image
                                src="/VisionPro.png"
                                alt="VisionPro"
                                width={136}
                                height={190}
                                priority
                                quality={100}
                                className="object-contain w-auto h-2/3"
                            />
                            <div className="flex flex-col gap-4 w-2/6 mr-12">
                                <h2 className="text-3xl font-[100] text-white">Apple Vision <span className="font-bold">Pro</span></h2>
                                <p className="text-gray-400 text-xs">An immersive way to experience entertainment</p>
                            </div>
                        </div>
                    </div>

                </div>

                <div className="bg-[#EDEDED] h-[600px] flex items-center justify-between overflow-hidden">

                    <div className="pl-13 flex flex-col gap-4 items-start">
                        <div>
                        <h1 className="text-6xl font-[100]">Macbook</h1>
                        <h1 className="text-6xl font-bold">Air</h1>
                        </div>
                        <p className="text-gray-400 text-xs">The new 15-inch MacBook Air makes room for more of what you love with a spacious Liquid Retina display.</p>
                        <Button variant='ghost' className="border border-black py-6 px-10 hover:bg-black hover:text-white hover:border-black">Shop Now</Button>
                    </div>

                    <Image
                        src="/MacBookPro14.png"
                        alt="MacBookPro14"
                        width={292}
                        height={502}
                        priority
                        quality={100}
                        className="object-contain w-auto h-[90%]"
                    />
                </div>
            </div>
        </section>
    )
}
