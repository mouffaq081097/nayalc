import { redirect } from 'next/navigation';

// The "Need anything else?" step between the bag and checkout was removed: the
// bag goes straight to checkout. Old links and bookmarks land there too.
export default function NeedAnythingElsePage() {
  redirect('/checkout');
}
