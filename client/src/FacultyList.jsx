import { API_URL } from './config';

const FacultyList = () => {
    const [faculties, setFaculties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch(`${API_URL}/api/faculties`)
            .then(res => res.json())
            .then(data => {
                setFaculties(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching faculty:", err);
                setError("Failed to load faculty.");
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="min-h-screen bg-[#7c2ae8] flex items-center justify-center text-white font-sans">Loading...</div>;
    if (error) return <div className="min-h-screen bg-[#7c2ae8] flex items-center justify-center text-white font-sans">{error}</div>;

    return (
        <div className="min-h-screen bg-[#7c2ae8] p-8 pt-24 font-sans text-white">
            <Link to="/" className="fixed top-6 left-6 text-white/70 hover:text-white transition z-10">
                ← Back to Home
            </Link>

            <div className="max-w-7xl mx-auto flex flex-col items-center">

                {/* Header omitted as per image style, but kept title for context if needed, or maybe user wants just cards? 
                   The image shows just a card. I will keep a simple title or remove it if it looks bad. 
                   Let's keep the title but make it subtle or just rely on the cards. 
                   Actually, let's keep the title "Faculty" but styled nicely.
                */}
                <div className="mb-12">
                    {/* <h1 className="text-4xl font-bold text-center">Faculty</h1> */}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 w-full">
                    {faculties.map((faculty) => (
                        <Link to={`/faculty/${faculty.id}`} key={faculty.id} className="bg-white/20 backdrop-blur-md rounded-[2.5rem] p-8 hover:bg-white/30 transition cursor-pointer flex flex-col items-center text-center border border-white/10 shadow-lg min-h-[340px] justify-center relative group w-full max-w-sm mx-auto">

                            {/* Avatar */}
                            <div className="w-28 h-28 bg-[#e5e7eb] rounded-full mb-6 flex items-center justify-center shadow-inner mx-auto">
                                <span className="text-gray-600 font-bold text-4xl">
                                    {faculty.name.charAt(0)}
                                </span>
                            </div>

                            {/* Name */}
                            <h2 className="text-2xl font-bold mb-2 leading-tight">{faculty.name}</h2>

                            {/* Department */}
                            <p className="text-white/90 text-sm mb-5 font-medium">{faculty.department}</p>

                            {/* Shortform Badge - Styled exactly like 'Anjali' in the screenshot */}
                            {faculty.aliases && faculty.aliases.length > 0 && (
                                <span className="bg-[#6366f1] text-white px-8 py-1.5 rounded-lg text-sm font-semibold shadow-sm tracking-wide">
                                    {faculty.aliases[0]}
                                </span>
                            )}
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FacultyList;
