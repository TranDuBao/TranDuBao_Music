import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Sparkles, Music2, Heart } from 'lucide-react';

interface Artist {
  id: number;
  name: string;
  genre: string;
  listeners: string;
  bio: string;
  image_url: string;
  glow_class: string;
  popular_track: string;
}

interface FeaturedArtistsProps {
  onArtistClick?: (name: string) => void;
}

export default function FeaturedArtists({ onArtistClick }: FeaturedArtistsProps) {
  const { t, i18n } = useTranslation();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchArtists = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/artists');
      const json = await res.json();
      if (json.success) {
        setArtists(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch artists:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArtists();

    // Listen for custom event to reload artists (e.g. when admin adds one)
    window.addEventListener('reload-artists', fetchArtists);
    return () => {
      window.removeEventListener('reload-artists', fetchArtists);
    };
  }, []);

  if (loading) {
    return (
      <section className="pt-10 border-t border-white/5 mt-12 space-y-6">
        <div className="flex items-center gap-2 text-purple-400">
          <Sparkles className="w-4 h-4 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider">{i18n.language === 'vi' ? 'Nghệ sĩ tiêu biểu' : 'Featured Artists'}</span>
        </div>
        <div className="flex flex-col gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="h-48 rounded-3xl bg-zinc-900/30 border border-white/5 animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (artists.length === 0) return null;

  return (
    <section className="pt-10 border-t border-white/5 mt-12 space-y-6">
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-purple-400">
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider">{i18n.language === 'vi' ? 'Nghệ sĩ tiêu biểu' : 'Featured Artists'}</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-zinc-400" />
            {i18n.language === 'vi' ? 'Giới Thiệu Các Siêu Sao' : 'Superstar Showcases'}
          </h2>
        </div>
      </div>

      {/* List of Artist Cards (One artist per horizontal row) */}
      <div className="flex flex-col gap-6">
        {artists.map((artist, idx) => (
          <ArtistCard key={artist.id} artist={artist} index={idx} onClick={() => onArtistClick?.(artist.name)} />
        ))}
      </div>
    </section>
  );
}

function ArtistCard({ artist, index, onClick }: { artist: Artist; index: number; onClick?: () => void }) {
  const { i18n } = useTranslation();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      {
        threshold: 0.05,
        rootMargin: '0px 0px -30px 0px'
      }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={cardRef}
      style={{ transitionDelay: `${index * 100}ms` }}
      onClick={onClick}
      className={`group relative flex flex-col md:flex-row items-stretch rounded-3xl overflow-hidden border border-white/5 bg-zinc-950/45 backdrop-blur-md transition-all duration-1000 transform hover:scale-[1.005] cursor-pointer hover:border-purple-500/30 ${
        artist.glow_class
      } ${
        isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-[0.98]'
      }`}
    >
      {/* Left side: Image */}
      <div className="relative w-full md:w-[280px] h-[220px] md:h-auto flex-shrink-0 overflow-hidden">
        <img
          src={artist.image_url}
          alt={artist.name}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        {/* Ambient fade overlays */}
        <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-transparent to-zinc-950/90 z-10 pointer-events-none" />
      </div>

      {/* Right side: Content */}
      <div className="flex-1 p-6 md:p-7 flex flex-col justify-between z-20 relative bg-zinc-950/20">
        <div className="space-y-3">
          {/* Header row: Genre, listeners, etc. */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-[10px] font-bold tracking-wider uppercase bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-full text-zinc-300 border border-white/5">
              {artist.genre}
            </span>
            <span className="text-[10px] font-medium text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-full flex items-center gap-1">
              <Heart className="w-3 h-3 fill-current" />
              {artist.listeners} {i18n.language === 'vi' ? '/ tháng' : '/ month'}
            </span>
          </div>

          {/* Artist Name */}
          <h3 className="text-2xl font-extrabold text-white tracking-tight group-hover:text-purple-300 transition-colors duration-300">
            {artist.name}
          </h3>

          {/* Bio */}
          <p className="text-xs text-zinc-400 leading-relaxed max-w-3xl">
            {artist.bio}
          </p>
        </div>

        {/* Popular Track details */}
        <div className="flex items-center gap-2 border-t border-white/5 pt-3 mt-4 text-xs text-zinc-500">
          <Music2 className="w-4 h-4 text-purple-400 animate-spin" style={{ animationDuration: '6s' }} />
          <span>{i18n.language === 'vi' ? 'Bài hát nổi bật nhất:' : 'Most popular track:'} <strong className="text-white group-hover:text-purple-300 transition-colors duration-300">{artist.popular_track}</strong></span>
        </div>
      </div>
    </div>
  );
}
