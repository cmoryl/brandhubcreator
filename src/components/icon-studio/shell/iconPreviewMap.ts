/**
 * Emoji → Lucide icon mapping used by IconSetPreview to render real
 * vector previews instead of emoji glyphs across the Icon Studio.
 *
 * Anything unmapped falls back to `Shapes` so previews never break.
 */

import {
  Activity, AlertTriangle, Anchor, Award, Banknote, BarChart3, Bell, BellOff,
  Book, BookOpen, Box, Briefcase, Building2, Calendar, Camera, Check, CheckCircle2,
  ClipboardList, Cloud, Code2, Coffee, Cog, Compass, CreditCard, Cpu, Database,
  Diamond, DollarSign, Download, Droplet, FileText, Film, Filter, Flag, FlaskConical,
  Folder, FolderOpen, Gamepad2, Gauge, Gem, Gift, Globe, Hammer, HardDrive, Headphones,
  Heart, HeartPulse, Home, Image as ImageIcon, Info, Key, KeyRound, Landmark, Languages,
  Layers, LifeBuoy, Lightbulb, Link, Lock, LogIn, LogOut, Mail, Map, MapPin, Megaphone,
  MessageCircle, MessageSquare, Mic, Microscope, Monitor, Moon, MoreHorizontal,
  Newspaper, Package, PaintBucket, Palette, Pencil, Phone, PieChart, Pill, Plane, Play,
  Plug, Plus, Printer, RefreshCw, Rocket, Route, Save, Scale, Scan, Search, Send,
  Server, Settings, Share2, Shield, ShieldCheck, ShoppingBag, ShoppingCart, Sliders,
  Smartphone, Sparkles, Square, Star, Stethoscope, Store, Sun, Tag, Target, Ticket,
  Timer, Trash2, TrendingUp, Truck, Tv, Upload, User, Users, Video, Wallet, Wand2,
  Wifi, Wrench, Zap, Shapes,
  type LucideIcon,
} from 'lucide-react';

const EMOJI_TO_LUCIDE: Record<string, LucideIcon> = {
  // ai / tech / dev
  '✨': Sparkles, '🪄': Wand2, '🧠': Cpu, '🤖': Cpu, '⚡': Zap, '🔌': Plug, '🧩': Layers,
  '⚙️': Settings, '🛠️': Wrench, '🔧': Wrench, '🚀': Rocket, '💡': Lightbulb,
  '📡': Wifi, '🔁': RefreshCw, '🔄': RefreshCw, '🎛️': Sliders, '🧪': FlaskConical,
  '👩‍💻': Code2, '🧭': Compass, '🔗': Link,

  // data / analytics
  '📊': BarChart3, '📈': TrendingUp, '📉': BarChart3, '🎯': Target, '🧮': PieChart,
  '🔍': Search, '🗂️': FolderOpen, '📂': Folder, '📋': ClipboardList,

  // security / compliance / trust
  '🛡️': Shield, '🔐': Lock, '🔒': Lock, '🔑': KeyRound, '🪪': User, '🚨': AlertTriangle,
  '✅': CheckCircle2, '⛔': AlertTriangle, '🛂': ShieldCheck, '📜': FileText,
  '🪙': Award,

  // commerce / retail
  '🛒': ShoppingCart, '🛍️': ShoppingBag, '🏷️': Tag, '📦': Package, '🚚': Truck,
  '🎁': Gift, '⭐': Star, '💰': Wallet, '💳': CreditCard, '💸': Banknote, '🧾': FileText,
  '🎟️': Ticket, '🏪': Store,

  // finance / legal
  '🏦': Landmark, '⚖️': Scale, '🏛️': Building2, '📑': FileText,

  // healthcare / life sciences
  '🩺': Stethoscope, '💊': Pill, '🧬': FlaskConical, '🩻': Activity, '❤️': HeartPulse,
  '🏥': Building2, '💉': Activity, '🔬': Microscope, '🧑‍⚕️': User,

  // travel / hospitality
  '✈️': Plane, '🏨': Building2, '🗺️': Map, '🧳': Briefcase, '🛎️': Bell, '🎫': Ticket,
  '🌍': Globe, '🌐': Globe,

  // gaming / media
  '🎮': Gamepad2, '🏆': Award, '⚔️': Sliders, '🎲': Diamond, '💎': Gem, '🔫': Zap,
  '📰': Newspaper, '🎬': Film, '🎙️': Mic, '📺': Tv, '📷': Camera, '🎞️': Film,
  '🎶': Headphones,

  // education
  '📚': BookOpen, '🎓': Award, '✏️': Pencil, '🧑‍🏫': User, '📝': FileText, '🏫': Building2,
  '📖': Book,

  // government / nonprofit
  '🗳️': Check, '🆔': User, '🤝': Users, '📣': Megaphone, '💝': Gift, '🙌': Users,

  // manufacturing / energy
  '🏭': Building2, '📐': Square, '🧰': Briefcase, '🔋': Zap, '🌞': Sun, '🌬️': Cloud,
  '💧': Droplet, '🛢️': Database,

  // messaging / notifications / users
  '💬': MessageSquare, '📧': Mail, '📨': Mail, '🔔': Bell, '🔕': BellOff, '📞': Phone,
  '👤': User, '👥': Users, '🚪': LogOut, '🏠': Home, '📍': MapPin,

  // workflow / process
  '🌿': Route, '▶️': Play, '🎉': Sparkles, '🎬': Film,

  // language services (TransPerfect)
  '🗣️': Languages, '🌎': Globe, '🌏': Globe,
};

export const iconForEmoji = (emoji: string): LucideIcon =>
  EMOJI_TO_LUCIDE[emoji] ?? Shapes;

/** Resolve a list of emojis to a list of Lucide icons (de-duplicated). */
export const iconsFromEmojis = (emojis: string[], min = 6): LucideIcon[] => {
  const seen = new Set<LucideIcon>();
  const out: LucideIcon[] = [];
  emojis.forEach((e) => {
    const Ico = iconForEmoji(e);
    if (!seen.has(Ico)) {
      seen.add(Ico);
      out.push(Ico);
    }
  });
  // Pad with sensible defaults if the source is too short.
  const pad = [Sparkles, Layers, Box, Star, Heart, Target];
  let i = 0;
  while (out.length < min && i < pad.length) {
    if (!seen.has(pad[i])) {
      seen.add(pad[i]);
      out.push(pad[i]);
    }
    i++;
  }
  return out;
};
