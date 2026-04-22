import maybrat from "@/Logo/kabupaten maybrat.png";
import rajaAmpat from "@/Logo/kabupaten raja ampat.png";
import sorongSelatan from "@/Logo/kabupaten sorong selatan.png";
import sorong from "@/Logo/kabupaten sorong.png";
import tambrauw from "@/Logo/kabupaten tambrauw.png";
import kotaSorong from "@/Logo/kota sorong.png";
import pbd from "@/assets/logo-papua-barat-daya.png";

export const PROVINCE_LOGO = pbd;
export const CO_ADMIN_LOGO = "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Coat_of_arms_of_West_Papua.svg/500px-Coat_of_arms_of_West_Papua.svg.png"; // Papua Barat

export const WILAYAH_LOGOS = {
  'KOTA_SOR': kotaSorong,
  'KAB_SOR': sorong,
  'KAB_SORSEL': sorongSelatan,
  'KAB_MAY': maybrat,
  'KAB_TAM': tambrauw,
  'KAB_RA': rajaAmpat
};

export const ALL_LOGOS = [
  { id: 'pbd', src: pbd, alt: 'Papua Barat Daya', isProv: true },
  { id: 'pb', src: CO_ADMIN_LOGO, alt: 'Papua Barat (Co-Admin)', isProv: true },
  { id: 'KOTA_SOR', src: kotaSorong, alt: 'Kota Sorong' },
  { id: 'KAB_SOR', src: sorong, alt: 'Kabupaten Sorong' },
  { id: 'KAB_SORSEL', src: sorongSelatan, alt: 'Kabupaten Sorong Selatan' },
  { id: 'KAB_MAY', src: maybrat, alt: 'Kabupaten Maybrat' },
  { id: 'KAB_TAM', src: tambrauw, alt: 'Kabupaten Tambrauw' },
  { id: 'KAB_RA', src: rajaAmpat, alt: 'Kabupaten Raja Ampat' }
];

export function LogoRow({ className = "" }) {
  return (
    <div className={`flex items-center gap-3 sm:gap-4 flex-wrap ${className}`}>
      {ALL_LOGOS.map((l) => (
        <div key={l.id} className="relative group">
           {l.id === 'pb' && (
             <div className="absolute -top-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-amber-500 text-black text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded shadow-lg pointer-events-none whitespace-nowrap z-10">Co-Admin</div>
           )}
           <img
             src={l.src?.src || l.src}
             alt={l.alt}
             title={l.alt}
             className={`object-contain bg-white/5 rounded-xl p-1.5 border border-white/10 ${l.isProv ? "w-10 h-10 sm:w-16 sm:h-16 shadow-[0_0_15px_rgba(255,255,255,0.1)]" : "w-8 h-8 sm:w-12 sm:h-12"} hover:scale-110 hover:border-amber-500/50 hover:bg-amber-500/10 transition-all cursor-pointer`}
           />
        </div>
      ))}
    </div>
  );
}
