export default function Footer() {
  return (
    <footer className="relative border-t border-ink/10 px-6 py-6 md:px-10 lg:px-16">
      <div className="flex items-center justify-center">
        <p className="text-sm text-stone">
          &copy; {new Date().getFullYear()} <span className="text-accent">BrainTrain Academy</span>. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}
