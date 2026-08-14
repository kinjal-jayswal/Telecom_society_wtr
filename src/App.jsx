import React, { useState, useEffect, useRef } from 'react';
import { 
  Home, 
  User, 
  ShieldCheck, 
  MessageSquare, 
  ChevronRight, 
  Download, 
  Upload, 
  Database, 
  Search, 
  FileText, 
  HelpCircle, 
  Calculator, 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar,
  DollarSign, 
  ShieldAlert,
  Send,
  Sparkles,
  RefreshCw
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [showWhatsappBot, setShowWhatsappBot] = useState(false);
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');
  
  // Custom Settings & Board of Directors States
  const [settings, setSettings] = useState({
    society_name: "Ahmedabad Telephone Employees' Co-Operative Credit & Supply Society Limited",
    address: 'Central Telephone Exchange Building, Shahpur Road, Ahmedabad - 380 001',
    phone: '079 - 2562 6999',
    email: 'atdcresoc@gmail.com',
    established_year: '1951',
    interest_rate: '8.4',
    max_pmt_amount: '700000'
  });
  const [boardMembers, setBoardMembers] = useState([]);
  
  // Board editing state
  const [editingDirector, setEditingDirector] = useState(null);
  const [directorName, setDirectorName] = useState('');
  const [directorRole, setDirectorRole] = useState('');
  const [directorInitials, setDirectorInitials] = useState('');
  const [directorOrder, setDirectorOrder] = useState('0');
  const [directorPhotoFile, setDirectorPhotoFile] = useState(null);
  const [directorPhotoPreview, setDirectorPhotoPreview] = useState('');
  
  // Settings form editing state
  const [editSocietyName, setEditSocietyName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editEstablishedYear, setEditEstablishedYear] = useState('');
  const [editInterestRate, setEditInterestRate] = useState('');
  const [editMaxPmtAmount, setEditMaxPmtAmount] = useState('');
  const [settingsMessage, setSettingsMessage] = useState('');
  const [directorMessage, setDirectorMessage] = useState('');
  
  // Sub-navigation inside Admin Workspace
  const [adminTab, setAdminTab] = useState('upload'); // 'upload', 'backups', 'board', 'settings'

  // Search Form State
  const [searchStaffNo, setSearchStaffNo] = useState('');
  const [searchYear, setSearchYear] = useState('2026');
  const [searchMonth, setSearchMonth] = useState('07');
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState('');
  const [searchNoLoanMember, setSearchNoLoanMember] = useState(null);
  const [searchMultipleMatches, setSearchMultipleMatches] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Member Portal sub-tab + Ledger Details State
  const [memberPortalTab, setMemberPortalTab] = useState('receipts'); // 'receipts' | 'ledger'
  const [ledgerSearchInput, setLedgerSearchInput] = useState('');
  const [ledgerResult, setLedgerResult] = useState(null);
  const [ledgerError, setLedgerError] = useState('');
  const [ledgerMultipleMatches, setLedgerMultipleMatches] = useState(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerSuggestions, setLedgerSuggestions] = useState([]);
  const [showLedgerSuggestions, setShowLedgerSuggestions] = useState(false);

  // Admin Data Upload State
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [uploadUsedAI, setUploadUsedAI] = useState(false);

  // Society Workbook Importer State (the "members details" + "ledger" format)
  const [societyFile, setSocietyFile] = useState(null);
  const [societyPreviewLoading, setSocietyPreviewLoading] = useState(false);
  const [societyPreview, setSocietyPreview] = useState(null);
  const [societyImporting, setSocietyImporting] = useState(false);
  const [societyImportResult, setSocietyImportResult] = useState(null);
  const [societyError, setSocietyError] = useState('');

  // AI-Assisted Parsing (Claude) State
  const [aiStatus, setAiStatus] = useState({ configured: false, model: '', enabled: false });
  const [aiToggleLoading, setAiToggleLoading] = useState(false);
  const [aiTestLoading, setAiTestLoading] = useState(false);
  const [aiTestResult, setAiTestResult] = useState(null);

  // Backup State
  const [backups, setBackups] = useState([]);
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupMessage, setBackupMessage] = useState('');
  const [offsiteStatus, setOffsiteStatus] = useState({ bucketConfigured: false, emailConfigured: false });
  const [emailTestLoading, setEmailTestLoading] = useState(false);
  const [emailTestResult, setEmailTestResult] = useState(null);
  const [restoreFile, setRestoreFile] = useState(null);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState('');

  // Member management state
  const [members, setMembers] = useState([]);
  const [selectedMemberSummary, setSelectedMemberSummary] = useState(null);

  // Loan Calculator State
  const [calcLoanType, setCalcLoanType] = useState('PMT');
  const [calcAmount, setCalcAmount] = useState(200000);
  const [calcMonths, setCalcMonths] = useState(36);
  const [calcRate, setCalcRate] = useState(8.4);

  // WhatsApp Bot simulator state
  const [chatMessages, setChatMessages] = useState([
    { sender: 'bot', text: '👋 Namaste! Welcome to **ATD Credit & Supply Society Bot**.\n\nYou can query your account information by sending these commands:\n\n*   **receipt <Staff_No> <Month_No> <Year>** - Ex: `receipt 1001 07 2026` to download July 2026 Recovery Receipt.\n*   **loans <Staff_No>** - Ex: `loans 1001` to view your active loans and remaining balances.\n*   **summary <Staff_No>** - Ex: `summary 1001` to get a quick overview of your profile.', time: 'Just now' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  // Fetch Settings & Board Members on mount
  useEffect(() => {
    fetchSettings();
    fetchBoardMembers();
  }, []);

  // Fetch backups and members list for admin
  useEffect(() => {
    if (adminLoggedIn) {
      fetchBackups();
      fetchMembers();
      fetchAIStatus();
      fetchOffsiteStatus();
    }
  }, [adminLoggedIn]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isTyping]);

  // Live autocomplete for the receipt search field — debounced so it
  // doesn't fire a request on every keystroke.
  useEffect(() => {
    if (!searchStaffNo || searchStaffNo.trim().length < 2) {
      setSearchSuggestions([]);
      return;
    }
    const handle = setTimeout(async () => {
      try {
        const res = await fetch(`/api/members/search?q=${encodeURIComponent(searchStaffNo)}`);
        const data = await res.json();
        if (res.ok) setSearchSuggestions(data);
      } catch (err) {
        // Live suggestions are a convenience — fail silently and let the
        // normal Search Receipt submit surface any real error.
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [searchStaffNo]);

  // Same live autocomplete, for the Ledger Details search box.
  useEffect(() => {
    if (!ledgerSearchInput || ledgerSearchInput.trim().length < 2) {
      setLedgerSuggestions([]);
      return;
    }
    const handle = setTimeout(async () => {
      try {
        const res = await fetch(`/api/members/search?q=${encodeURIComponent(ledgerSearchInput)}`);
        const data = await res.json();
        if (res.ok) setLedgerSuggestions(data);
      } catch (err) {
        // Live suggestions are a convenience — fail silently.
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [ledgerSearchInput]);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (res.ok) {
        setSettings(data);
        setEditSocietyName(data.society_name || '');
        setEditAddress(data.address || '');
        setEditPhone(data.phone || '');
        setEditEmail(data.email || '');
        setEditEstablishedYear(data.established_year || '');
        setEditInterestRate(data.interest_rate || '');
        setEditMaxPmtAmount(data.max_pmt_amount || '');
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  const fetchBoardMembers = async () => {
    try {
      const res = await fetch('/api/board');
      const data = await res.json();
      if (res.ok) setBoardMembers(data);
    } catch (err) {
      console.error('Error fetching board members:', err);
    }
  };

  // AI-Assisted Parsing (Claude): status, on/off toggle, and a connection test
  const fetchAIStatus = async () => {
    try {
      const res = await fetch('/api/ai-status');
      const data = await res.json();
      if (res.ok) setAiStatus(data);
    } catch (err) {
      console.error('Error fetching AI status:', err);
    }
  };

  const handleToggleAI = async () => {
    setAiToggleLoading(true);
    setAiTestResult(null);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ai_parsing_enabled: (!aiStatus.enabled).toString() })
      });
      if (res.ok) {
        await fetchAIStatus();
      }
    } catch (err) {
      console.error('Error toggling AI parsing:', err);
    } finally {
      setAiToggleLoading(false);
    }
  };

  const handleTestAI = async () => {
    setAiTestLoading(true);
    setAiTestResult(null);
    try {
      const res = await fetch('/api/ai-status/test', { method: 'POST' });
      const data = await res.json();
      setAiTestResult(data);
    } catch (err) {
      setAiTestResult({ ok: false, error: 'Network error testing AI connection.' });
    } finally {
      setAiTestLoading(false);
    }
  };

  // Save brand settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSettingsMessage('');
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          society_name: editSocietyName,
          address: editAddress,
          phone: editPhone,
          email: editEmail,
          established_year: editEstablishedYear,
          interest_rate: editInterestRate,
          max_pmt_amount: editMaxPmtAmount
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSettingsMessage('Settings saved successfully!');
        fetchSettings();
      } else {
        setSettingsMessage(`Error saving settings: ${data.error}`);
      }
    } catch (err) {
      setSettingsMessage('Network error saving settings.');
    }
  };

  // Add/Edit Board Member
  const handleSaveDirector = async (e) => {
    e.preventDefault();
    setDirectorMessage('');
    if (!directorName || !directorRole || !directorInitials) {
      setDirectorMessage('Name, Role, and Initials are required.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', directorName);
      formData.append('role', directorRole);
      formData.append('initials', directorInitials);
      formData.append('display_order', parseInt(directorOrder) || 0);
      if (directorPhotoFile) {
        formData.append('photo', directorPhotoFile);
      }

      let url = '/api/board';
      let method = 'POST';

      if (editingDirector) {
        url = `/api/board/${editingDirector.id}`;
        method = 'PUT';
      }

      // No Content-Type header here — the browser sets the multipart
      // boundary automatically when the body is a FormData instance.
      const res = await fetch(url, { method, body: formData });

      const data = await res.json();
      if (res.ok) {
        setDirectorMessage(editingDirector ? 'Director updated successfully!' : 'Director added successfully!');
        // Reset form
        setDirectorName('');
        setDirectorRole('');
        setDirectorInitials('');
        setDirectorOrder('0');
        setDirectorPhotoFile(null);
        setDirectorPhotoPreview('');
        setEditingDirector(null);
        fetchBoardMembers();
      } else {
        setDirectorMessage(`Error: ${data.error}`);
      }
    } catch (err) {
      setDirectorMessage('Network error saving director details.');
    }
  };

  // Populate the form to edit an existing board member (also handles
  // the "Edit" button on the admin board list)
  const startEditDirector = (director) => {
    setEditingDirector(director);
    setDirectorName(director.name);
    setDirectorRole(director.role);
    setDirectorInitials(director.initials);
    setDirectorOrder(String(director.display_order ?? 0));
    setDirectorPhotoFile(null);
    setDirectorPhotoPreview(director.photo_url || '');
    setDirectorMessage('');
  };

  const handleDirectorPhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setDirectorPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setDirectorPhotoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  // Delete Board Member
  const handleDeleteDirector = async (id) => {
    if (!confirm('Are you sure you want to delete this Board Director?')) return;
    setDirectorMessage('');
    try {
      const res = await fetch(`/api/board/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        setDirectorMessage('Director deleted successfully.');
        fetchBoardMembers();
      } else {
        setDirectorMessage(`Error: ${data.error}`);
      }
    } catch (err) {
      setDirectorMessage('Network error deleting director.');
    }
  };

  const fetchBackups = async () => {
    try {
      const res = await fetch('/api/backups');
      const data = await res.json();
      if (res.ok) setBackups(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await fetch('/api/members');
      const data = await res.json();
      if (res.ok) setMembers(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Perform Manual Backup
  const triggerManualBackup = async () => {
    setBackupLoading(true);
    setBackupMessage('');
    try {
      const res = await fetch('/api/backups/run', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setBackupMessage(`Backup successfully created: ${data.backup.filename}`);
        fetchBackups();
      } else {
        setBackupMessage(`Error creating backup: ${data.error}`);
      }
    } catch (err) {
      setBackupMessage('Network error triggering backup.');
    } finally {
      setBackupLoading(false);
    }
  };

  // Restore from a previously exported JSON backup file. Destructive —
  // clears every table before re-inserting the backup's rows — so this
  // requires an explicit confirmation before it runs.
  const handleRestoreBackup = async () => {
    if (!restoreFile) {
      setRestoreMessage('Select a backup JSON file first.');
      return;
    }
    if (!confirm('This will DELETE all current members, receipts, loans, board members, and settings, then replace them with the contents of this backup file. This cannot be undone. Continue?')) {
      return;
    }

    setRestoreLoading(true);
    setRestoreMessage('');

    const formData = new FormData();
    formData.append('file', restoreFile);

    try {
      const res = await fetch('/api/backups/import', { method: 'POST', body: formData });
      const data = await res.json();

      if (res.ok) {
        const { stats } = data;
        const errorNote = stats.errors.length > 0 ? ` (${stats.errors.length} row(s) failed — check server logs)` : '';
        setRestoreMessage(`Restored ${stats.members} members, ${stats.loans} loans, ${stats.receipts} receipts, ${stats.boardMembers} board members, ${stats.settings} settings.${errorNote}`);
        setRestoreFile(null);
        fetchBackups();
        fetchMembers();
        fetchBoardMembers();
        fetchSettings();
      } else {
        setRestoreMessage(`Error: ${data.error}`);
      }
    } catch (err) {
      setRestoreMessage('Network error restoring backup.');
    } finally {
      setRestoreLoading(false);
    }
  };

  // Offsite backup destinations (Railway bucket / email) — status + test
  const fetchOffsiteStatus = async () => {
    try {
      const res = await fetch('/api/backups/status');
      const data = await res.json();
      if (res.ok) setOffsiteStatus(data);
    } catch (err) {
      console.error('Error fetching offsite backup status:', err);
    }
  };

  const handleTestEmail = async () => {
    setEmailTestLoading(true);
    setEmailTestResult(null);
    try {
      const res = await fetch('/api/backups/status/test-email', { method: 'POST' });
      const data = await res.json();
      setEmailTestResult(data);
    } catch (err) {
      setEmailTestResult({ ok: false, error: 'Network error testing email connection.' });
    } finally {
      setEmailTestLoading(false);
    }
  };

  // Fetch receipt details. Accepts an optional identifier override so
  // clicking a name in the disambiguation list (see handleSelectMatch) can
  // re-search immediately without waiting on the async state update from
  // setSearchStaffNo.
  const handleReceiptSearch = async (e, overrideAccount) => {
    if (e && e.preventDefault) e.preventDefault();
    const account = overrideAccount || searchStaffNo;
    if (!account) {
      setSearchError('Please enter your Staff/HRMS No., phone, or name.');
      return;
    }
    setSearchLoading(true);
    setSearchError('');
    setSearchResult(null);
    setSearchNoLoanMember(null);
    setSearchMultipleMatches(null);

    try {
      const url = `/api/receipts/search?account=${encodeURIComponent(account)}&year=${searchYear}&month=${searchMonth}`;
      const res = await fetch(url);
      const data = await res.json();

      if (res.ok) {
        setSearchResult(data);
      } else if (data.multipleMatches) {
        setSearchMultipleMatches(data.matches);
        setSearchError(data.error);
      } else if (data.noLoan) {
        setSearchNoLoanMember(data.member);
      } else {
        setSearchError(data.error || 'No matching receipt found.');
      }
    } catch (err) {
      setSearchError('Network error searching for receipt. Please verify backend is running.');
    } finally {
      setSearchLoading(false);
    }
  };

  // A member picked their name — either from the live autocomplete
  // dropdown while typing, or the post-search disambiguation list. Either
  // way: lock the search field to their exact Staff/HRMS No. and
  // re-search immediately.
  const handleSelectMatch = (staffNo) => {
    setSearchStaffNo(staffNo);
    setSearchSuggestions([]);
    setShowSuggestions(false);
    handleReceiptSearch(null, staffNo);
  };

  // Full ledger/loan history lookup — same identifier resolution as
  // receipt search (Staff/HRMS No., phone, or name), but fetches
  // everything on file for that member via /api/members/lookup.
  const handleLedgerSearch = async (e, overrideIdentifier) => {
    if (e && e.preventDefault) e.preventDefault();
    const identifier = overrideIdentifier || ledgerSearchInput;
    if (!identifier) {
      setLedgerError('Please enter a Staff/HRMS No., phone, or name.');
      return;
    }
    setLedgerLoading(true);
    setLedgerError('');
    setLedgerResult(null);
    setLedgerMultipleMatches(null);

    try {
      const res = await fetch(`/api/members/lookup?identifier=${encodeURIComponent(identifier)}`);
      const data = await res.json();
      if (res.ok) {
        setLedgerResult(data);
      } else if (data.multipleMatches) {
        setLedgerMultipleMatches(data.matches);
        setLedgerError(data.error);
      } else {
        setLedgerError(data.error || 'No member found.');
      }
    } catch (err) {
      setLedgerError('Network error searching for member.');
    } finally {
      setLedgerLoading(false);
    }
  };

  const handleSelectLedgerMatch = (staffNo) => {
    setLedgerSearchInput(staffNo);
    setLedgerSuggestions([]);
    setShowLedgerSuggestions(false);
    handleLedgerSearch(null, staffNo);
  };

  // Opens WhatsApp (app or web) with the receipt pre-filled as a message.
  // Uses the wa.me share link, not the WhatsApp Business API, so there's no
  // account setup and nothing is sent automatically — the recipient still
  // has to hit Send themselves.
  const handleShareWhatsApp = () => {
    if (!searchResult) return;

    const message = `📄 *Recovery Receipt - ${searchMonth}/${searchYear}*\n----------------------------------------\n👤 *Member:* ${searchResult.name}\n🆔 *Staff No:* ${searchResult.staff_no}\n\n💰 *Savings Deposit:* ₹${searchResult.savings_deposit.toLocaleString()}\n🏦 *Loan Recovery:* ₹${searchResult.loan_recovery.toLocaleString()}\n📈 *Interest Recovery:* ₹${searchResult.interest_recovery.toLocaleString()}\n\n💵 *Total Recovered:* ₹${searchResult.total_recovered.toLocaleString()}\n----------------------------------------\n${settings.society_name || 'ATD Credit & Supply Society'}`;

    // Indian mobile numbers are stored as 10 digits with no country code;
    // wa.me needs the country code to pre-select the recipient.
    const digits = (searchResult.phone || '').replace(/\D/g, '');
    const phoneWithCountryCode = digits ? (digits.length === 10 ? `91${digits}` : digits) : '';

    const url = phoneWithCountryCode
      ? `https://wa.me/${phoneWithCountryCode}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // View member dashboard details
  const fetchMemberSummary = async (staffNo) => {
    try {
      const res = await fetch(`/api/members/${staffNo}/summary`);
      const data = await res.json();
      if (res.ok) {
        setSelectedMemberSummary(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Admin Login
  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminUsername === 'admin' && adminPassword === 'atdcresoc2026') {
      setAdminLoggedIn(true);
      setAdminError('');
    } else {
      setAdminError('Invalid admin credentials. (Hint: admin / atdcresoc2026)');
    }
  };

  // Handle file uploads
  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError('Please select a file to upload.');
      return;
    }

    setUploadLoading(true);
    setUploadError('');
    setUploadSuccess('');
    setUploadUsedAI(false);

    const formData = new FormData();
    formData.append('file', uploadFile);

    try {
      const res = await fetch('/api/upload-data', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (res.ok) {
        setUploadUsedAI(!!data.aiUsed);
        const parserNote = data.aiUsed
          ? `Parsed with AI assistance (${aiStatus.model})`
          : (data.aiError ? `AI parsing failed, used standard parser instead (${data.aiError})` : 'Parsed with standard parser');
        setUploadSuccess(`File parsed and records saved successfully!\n- Parser used: ${parserNote}\n- Receipts imported: ${data.recordsParsed}`);
        fetchMembers();
      } else {
        setUploadError(data.error || 'Failed to process file.');
      }
    } catch (err) {
      setUploadError('Network error uploading file.');
    } finally {
      setUploadLoading(false);
    }
  };

  // Preview the "members details" + "ledger" workbook format without
  // writing anything to the database — always run this before importing.
  const handlePreviewSocietyWorkbook = async () => {
    if (!societyFile) {
      setSocietyError('Select a workbook file first.');
      return;
    }
    setSocietyPreviewLoading(true);
    setSocietyError('');
    setSocietyPreview(null);
    setSocietyImportResult(null);

    const formData = new FormData();
    formData.append('file', societyFile);

    try {
      const res = await fetch('/api/upload-data/society-workbook?dryRun=true', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok) {
        setSocietyPreview(data);
      } else {
        setSocietyError(data.error || 'Failed to preview file.');
      }
    } catch (err) {
      setSocietyError('Network error previewing file.');
    } finally {
      setSocietyPreviewLoading(false);
    }
  };

  // Actually writes the previewed workbook's data into the database.
  // Only enabled after a preview has been reviewed.
  const handleConfirmSocietyImport = async () => {
    if (!societyFile || !societyPreview) return;
    if (!confirm(`Import ${societyPreview.memberCount} members and ${societyPreview.receiptCount} receipts into the live database? This adds/updates records — it does not delete anything.`)) {
      return;
    }

    setSocietyImporting(true);
    setSocietyError('');

    const formData = new FormData();
    formData.append('file', societyFile);

    try {
      const res = await fetch('/api/upload-data/society-workbook', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok) {
        setSocietyImportResult(data);
        setSocietyPreview(null);
        setSocietyFile(null);
        fetchMembers();
      } else {
        setSocietyError(data.error || 'Failed to import file.');
      }
    } catch (err) {
      setSocietyError('Network error importing file.');
    } finally {
      setSocietyImporting(false);
    }
  };

  // Handle chat messages in WhatsApp simulator
  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessageText = chatInput;
    setChatInput('');
    
    // Add user message to screen
    setChatMessages(prev => [...prev, { sender: 'user', text: userMessageText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    setIsTyping(true);

    try {
      const res = await fetch('/api/whatsapp/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessageText, sender: 'whatsapp-simulator-user' })
      });
      const data = await res.json();

      // Add delay to feel realistic
      setTimeout(() => {
        setIsTyping(false);
        setChatMessages(prev => [...prev, { sender: 'bot', text: data.response, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
      }, 800);

    } catch (err) {
      setIsTyping(false);
      setChatMessages(prev => [...prev, { sender: 'bot', text: '⚠️ Connection lost. Ensure backend is running.', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    }
  };

  // Dynamic Loan Calculator formula
  const getLoanCalculatorData = () => {
    const monthlyRate = (calcRate / 12) / 100;
    const emi = calcAmount * monthlyRate * Math.pow(1 + monthlyRate, calcMonths) / (Math.pow(1 + monthlyRate, calcMonths) - 1);
    const totalRepayment = emi * calcMonths;
    const totalInterest = totalRepayment - calcAmount;
    
    return {
      emi: isNaN(emi) ? 0 : Math.round(emi),
      totalRepayment: isNaN(totalRepayment) ? 0 : Math.round(totalRepayment),
      totalInterest: isNaN(totalInterest) ? 0 : Math.round(totalInterest)
    };
  };

  const calcResults = getLoanCalculatorData();

  // Preset settings when calculator loan type changes
  const handleCalcTypeChange = (type) => {
    setCalcLoanType(type);
    if (type === 'PMT') {
      setCalcAmount(300000);
      setCalcMonths(70);
      setCalcRate(8.4);
    } else if (type === 'Festival') {
      setCalcAmount(48000);
      setCalcMonths(12);
      setCalcRate(8.4);
    } else if (type === 'SP Food') {
      setCalcAmount(25000);
      setCalcMonths(10);
      setCalcRate(8.4);
    } else if (type === 'TMP') {
      setCalcAmount(4800);
      setCalcMonths(16);
      setCalcRate(8.4);
    }
  };

  return (
    <div className="app-container">
      {/* --- HEADER NAVBAR --- */}
      <header className="glass-panel" style={{ margin: '16px 24px', borderRadius: '12px', padding: '12px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          
          {/* Logo & Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => setActiveTab('home')}>
            <div style={{ background: 'var(--primary)', color: '#fff', padding: '8px', borderRadius: '8px', boxShadow: 'var(--glow-blue)' }}>
              <Database size={24} />
            </div>
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: '700', lineHeight: 1.2 }}>
                {settings.society_name ? settings.society_name.split(' ').slice(0, 3).join(' ') : 'ATD Credit & Supply'}
              </h1>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '500', tracking: '0.05em', display: 'block' }}>
                {settings.society_name ? settings.society_name.split(' ').slice(3).join(' ').toUpperCase() : 'CO-OPERATIVE SOCIETY LTD'}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', gap: '8px' }}>
            <button 
              className={`btn-secondary ${activeTab === 'home' ? 'active-nav-btn' : ''}`}
              style={activeTab === 'home' ? { borderBottom: '2px solid var(--primary)', borderRadius: '8px 8px 0 0' } : {}}
              onClick={() => setActiveTab('home')}
            >
              <Home size={16} /> Home
            </button>
            <button 
              className={`btn-secondary ${activeTab === 'member' ? 'active-nav-btn' : ''}`}
              style={activeTab === 'member' ? { borderBottom: '2px solid var(--primary)', borderRadius: '8px 8px 0 0' } : {}}
              onClick={() => setActiveTab('member')}
            >
              <User size={16} /> Member Portal
            </button>
            {adminLoggedIn && (
              <button 
                className={`btn-secondary ${activeTab === 'admin' ? 'active-nav-btn' : ''}`}
                style={activeTab === 'admin' ? { borderBottom: '2px solid var(--primary)', borderRadius: '8px 8px 0 0' } : {}}
                onClick={() => setActiveTab('admin')}
              >
                <ShieldCheck size={16} /> Admin Panel
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* --- CONTENT WORKSPACE --- */}
      <main style={{ padding: '0 24px 40px 24px', maxWidth: '1280px', margin: '0 auto', width: '100%' }} className="animate-fade-in">
        
        {/* ==================================== */}
        {/* 1. PUBLIC HOME PAGE                  */}
        {/* ==================================== */}
        {activeTab === 'home' && (
          <div>
            {/* Hero Section */}
            <div className="glass-panel" style={{ 
              padding: '60px 40px', 
              textAlign: 'center', 
              marginBottom: '32px', 
              position: 'relative', 
              overflow: 'hidden',
              background: 'linear-gradient(135deg, var(--primary) 0%, #1e1b4b 100%)',
              border: 'none',
              boxShadow: '0 20px 40px -15px rgba(79, 70, 229, 0.3)'
            }}>
              <div style={{ maxWidth: '750px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.1)', padding: '6px 14px', borderRadius: '20px', color: '#67e8f9', fontWeight: '600', fontSize: '13px', marginBottom: '20px' }}>
                  <Sparkles size={14} /> Redesigned & Reimagined for 2026
                </div>
                <h2 style={{ fontSize: '42px', fontWeight: '800', lineHeight: 1.15, marginBottom: '16px', color: '#ffffff', textShadow: '0 2px 8px rgba(0, 0, 0, 0.15)' }}>
                  {settings.society_name || "Ahmedabad Telephone Employees' Co-Op Credit & Supply Society Ltd."}
                </h2>
                <p style={{ color: '#cbd5e1', fontSize: '18px', marginBottom: '32px' }}>
                  Providing secure, competitive financial loans and deposit systems to members. Built on mutual aid and democratic co-operation.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
                  <button className="btn-primary" onClick={() => setActiveTab('member')}>
                    Access Recovery Receipt <ChevronRight size={16} />
                  </button>
                  <a href="#services-sec" className="btn-secondary" style={{ textDecoration: 'none', background: 'rgba(255, 255, 255, 0.08)', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
                    Explore Services
                  </a>
                </div>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '40px' }}>
              <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
                <h3 style={{ fontSize: '32px', color: 'var(--primary)', fontWeight: '700' }}>{settings.established_year || '1951'}</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Year Established</p>
              </div>
              <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
                <h3 style={{ fontSize: '32px', color: 'var(--accent-green)', fontWeight: '700' }}>{settings.interest_rate || '8.4'}%</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Fixed Loan Interest Rate</p>
              </div>
              <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
                <h3 style={{ fontSize: '32px', color: 'var(--accent-gold)', fontWeight: '700' }}>₹{Number(settings.max_pmt_amount || 700000).toLocaleString()}</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Max PMT Loan Amount</p>
              </div>
              <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
                <h3 style={{ fontSize: '32px', color: '#a855f7', fontWeight: '700' }}>14 Days</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Auto-Backup Schedule</p>
              </div>
            </div>

            {/* About and Services */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '40px' }}>
              
              {/* About Us section */}
              <div className="glass-panel" style={{ padding: '32px' }} id="about-sec">
                <h3 style={{ fontSize: '24px', marginBottom: '16px', borderBottom: '1px solid var(--surface-border)', paddingBottom: '12px' }}>About Our Society</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  The Ahmedabad Telephone Employees' Co-Operative Credit & Supply Society Limited was registered under the Co-operative Society Act VII 1925 with Registration No. 19938 on 8th November, 1951.
                </p>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                  Owned and controlled democratically by telephone employees, the society operates for the purpose of promoting thrift, arranging credit at competitive interest rates, and preventing indebtedness. We balance social responsibility and mutual aid for the collective benefit of all our members.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                    <h4 style={{ color: 'var(--primary)', marginBottom: '8px', fontSize: '16px' }}>Encourage Thrift</h4>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Helping members cultivate savings habits with high-yielding savings deposit features.</p>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                    <h4 style={{ color: 'var(--secondary)', marginBottom: '8px', fontSize: '16px' }}>Prevent Indebtedness</h4>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Allowing members to obtain emergency and standard loans on reasonable, non-predatory terms.</p>
                  </div>
                </div>
              </div>

              {/* Services & Loan Calculator section */}
              <div id="services-sec" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' }}>
                
                {/* Loan Cards */}
                <div className="glass-panel" style={{ padding: '32px' }}>
                  <h3 style={{ fontSize: '24px', marginBottom: '16px', borderBottom: '1px solid var(--surface-border)', paddingBottom: '12px' }}>Society Services</h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ borderBottom: '1px dashed var(--surface-border)', paddingBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontWeight: '600' }}>PMT Loan</span>
                        <span style={{ color: 'var(--primary)', fontWeight: '600' }}>Max ₹7,00,000</span>
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>8.4% interest rate, payable in max 70 installments. Requires 3 sureties.</p>
                    </div>
                    <div style={{ borderBottom: '1px dashed var(--surface-border)', paddingBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontWeight: '600' }}>Festival Loan</span>
                        <span style={{ color: 'var(--primary)', fontWeight: '600' }}>Max ₹48,000</span>
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>8.4% interest rate, payable in max 12 installments. Requires 2 sureties.</p>
                    </div>
                    <div style={{ borderBottom: '1px dashed var(--surface-border)', paddingBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontWeight: '600' }}>Special Food Loan</span>
                        <span style={{ color: 'var(--primary)', fontWeight: '600' }}>Max ₹25,000</span>
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>8.4% interest rate, payable in max 10 installments. Requires 2 sureties.</p>
                    </div>
                    <div style={{ borderBottom: '1px dashed var(--surface-border)', paddingBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontWeight: '600' }}>TMP Loan</span>
                        <span style={{ color: 'var(--primary)', fontWeight: '600' }}>Max ₹4,800</span>
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>8.4% interest rate, payable in max 16 installments.</p>
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontWeight: '600' }}>Savings Account</span>
                        <span style={{ color: 'var(--secondary)', fontWeight: '600' }}>3.5% p.a.</span>
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Encourages regular monthly deposits directly deducted from salary.</p>
                    </div>
                  </div>
                </div>

                {/* Loan Calculator */}
                <div className="glass-panel" style={{ padding: '32px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--surface-border)', paddingBottom: '12px' }}>
                    <Calculator size={20} className="text-primary" style={{ color: 'var(--primary)' }} />
                    <h3 style={{ fontSize: '24px' }}>Loan EMI Calculator</h3>
                  </div>

                  {/* Loan Selector Tabs */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
                    {['PMT', 'Festival', 'SP Food', 'TMP'].map((type) => (
                      <button 
                        key={type}
                        className={`btn-secondary ${calcLoanType === type ? 'active-calc' : ''}`}
                        style={{
                          padding: '6px 12px',
                          fontSize: '13px',
                          backgroundColor: calcLoanType === type ? 'var(--primary)' : 'transparent',
                          borderColor: calcLoanType === type ? 'var(--primary)' : 'var(--surface-border)'
                        }}
                        onClick={() => handleCalcTypeChange(type)}
                      >
                        {type}
                      </button>
                    ))}
                  </div>

                  {/* Calculator Inputs */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        <span>Loan Amount</span>
                        <span style={{ color: '#fff', fontWeight: '600' }}>₹{calcAmount.toLocaleString()}</span>
                      </div>
                      <input 
                        type="range" 
                        min="2000" 
                        max={calcLoanType === 'PMT' ? 700000 : calcLoanType === 'Festival' ? 48000 : calcLoanType === 'SP Food' ? 25000 : 4800} 
                        step="500"
                        value={calcAmount}
                        onChange={(e) => setCalcAmount(Number(e.target.value))}
                        style={{ width: '100%', accentColor: 'var(--primary)' }}
                      />
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        <span>Tenure (Months)</span>
                        <span style={{ color: '#fff', fontWeight: '600' }}>{calcMonths} Months</span>
                      </div>
                      <input 
                        type="range" 
                        min="2" 
                        max={calcLoanType === 'PMT' ? 70 : calcLoanType === 'Festival' ? 12 : calcLoanType === 'SP Food' ? 10 : 16} 
                        step="1"
                        value={calcMonths}
                        onChange={(e) => setCalcMonths(Number(e.target.value))}
                        style={{ width: '100%', accentColor: 'var(--primary)' }}
                      />
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        <span>Interest Rate</span>
                        <span style={{ color: '#fff', fontWeight: '600' }}>{calcRate}% p.a.</span>
                      </div>
                      <input 
                        type="text" 
                        className="form-input"
                        value={calcRate}
                        disabled
                        style={{ opacity: 0.7 }}
                      />
                    </div>
                  </div>

                  {/* Calculator Results */}
                  <div style={{ background: 'rgba(15, 23, 42, 0.5)', border: '1px solid var(--surface-border)', padding: '16px', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Monthly EMI:</span>
                      <span style={{ fontSize: '18px', fontWeight: '700', color: 'var(--secondary)' }}>₹{calcResults.emi.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Interest Payable:</span>
                      <span style={{ fontSize: '14px', fontWeight: '600' }}>₹{calcResults.totalInterest.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--surface-border)', paddingTop: '8px', marginTop: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '600' }}>Total Repayment:</span>
                      <span style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>₹{calcResults.totalRepayment.toLocaleString()}</span>
                    </div>
                  </div>

                </div>

              </div>

            </div>

            {/* Downloads & Forms section */}
            <div className="glass-panel" style={{ padding: '32px', marginTop: '40px' }} id="downloads-sec">
              <h3 style={{ fontSize: '24px', marginBottom: '20px', borderBottom: '1px solid var(--surface-border)', paddingBottom: '12px' }}>Downloads & Annual Reports</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                <div>
                  <h4 style={{ fontSize: '16px', marginBottom: '12px', color: 'var(--text-secondary)' }}>Useful Forms</h4>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <FileText size={18} style={{ color: 'var(--primary)' }} />
                      <span style={{ fontSize: '14px', fontWeight: '600' }}>New Membership Form.pdf</span>
                    </div>
                    <button className="btn-secondary" style={{ padding: '6px' }} onClick={() => alert('Download template Membership Form')}>
                      <Download size={14} />
                    </button>
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: '16px', marginBottom: '12px', color: 'var(--text-secondary)' }}>Recent Annual Reports</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {['Annual_Report_2024-25.pdf', 'Annual_Report_2023-24.pdf', 'Annual_Report_2022-23.pdf'].map((report, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                        <span style={{ fontSize: '13px' }}>{report.replace('_', ' ')}</span>
                        <button className="btn-secondary" style={{ padding: '6px' }} onClick={() => alert(`Download ${report}`)}>
                          <Download size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Team/Management */}
            <div className="glass-panel" style={{ padding: '32px', marginTop: '40px' }} id="team-sec">
              <h3 style={{ fontSize: '24px', marginBottom: '20px', borderBottom: '1px solid var(--surface-border)', paddingBottom: '12px' }}>Board of Directors</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                {boardMembers.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', width: '100%', textAlign: 'center', gridColumn: '1 / -1', padding: '24px 0' }}>
                    No board of directors configured yet. Manage this list in the Admin Panel.
                  </p>
                ) : (
                  boardMembers.map((b) => (
                    <div key={b.id} style={{ textAlign: 'center', background: 'rgba(0,0,0,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid var(--surface-border)', transition: 'all 0.2s' }}>
                      <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto', fontSize: '24px', fontWeight: '700', boxShadow: 'var(--glow-blue)', overflow: 'hidden' }}>
                        {b.photo_url ? (
                          <img src={b.photo_url} alt={b.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          b.initials
                        )}
                      </div>
                      <h4 style={{ fontSize: '15px' }}>{b.name}</h4>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{b.role}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Contact Section */}
            <div className="glass-panel" style={{ padding: '32px', marginTop: '40px' }} id="contact-sec">
              <h3 style={{ fontSize: '24px', marginBottom: '20px', borderBottom: '1px solid var(--surface-border)', paddingBottom: '12px' }}>Contact Us</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <h4 style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>Office Location:</h4>
                    <p style={{ fontSize: '14px' }}>{settings.address || 'Central Telephone Exchange Building, Shahpur Road, Ahmedabad - 380 001'}</p>
                  </div>
                  <div>
                    <h4 style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>Phone Helpline:</h4>
                    <p style={{ fontSize: '14px' }}>{settings.phone || '079 - 2562 6999'}</p>
                  </div>
                  <div>
                    <h4 style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>Email Support:</h4>
                    <p style={{ fontSize: '14px' }}>{settings.email || 'atdcresoc@gmail.com'}</p>
                  </div>
                </div>
                
                {/* Contact Form */}
                <form style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} onSubmit={(e) => { e.preventDefault(); alert('Message sent!'); }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <input type="text" placeholder="Your Name" className="form-input" required />
                    <input type="email" placeholder="Your Email" className="form-input" required />
                  </div>
                  <input type="text" placeholder="Subject" className="form-input" required />
                  <textarea placeholder="Message" className="form-input" rows="4" style={{ resize: 'none' }} required></textarea>
                  <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start' }}>Send Message</button>
                </form>
              </div>
            </div>

          </div>
        )}

        {/* ==================================== */}
        {/* 2. MEMBER PORTAL                     */}
        {/* ==================================== */}
        {activeTab === 'member' && (
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>

            {/* Page Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', padding: '10px', borderRadius: '10px' }}>
                <Search size={24} />
              </div>
              <div>
                <h2 style={{ fontSize: '28px', color: 'var(--text-primary)' }}>
                  {memberPortalTab === 'ledger' ? 'Member Ledger Details' : 'Member Recovery Receipts'}
                </h2>
                <p style={{ color: 'var(--text-secondary)' }}>
                  {memberPortalTab === 'ledger' ? 'View a member\'s full loan and payment history' : 'Access and print your monthly society recovery receipt'}
                </p>
              </div>
            </div>

            {/* Member Portal Sub-Navigation */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
              <button
                className={`btn-secondary ${memberPortalTab === 'receipts' ? 'active-nav-btn' : ''}`}
                style={{ fontSize: '13px', padding: '8px 16px', ...(memberPortalTab === 'receipts' ? { borderBottom: '2px solid var(--primary)', borderRadius: '8px 8px 0 0' } : {}) }}
                onClick={() => setMemberPortalTab('receipts')}
              >
                Recovery Receipts
              </button>
              <button
                className={`btn-secondary ${memberPortalTab === 'ledger' ? 'active-nav-btn' : ''}`}
                style={{ fontSize: '13px', padding: '8px 16px', ...(memberPortalTab === 'ledger' ? { borderBottom: '2px solid var(--primary)', borderRadius: '8px 8px 0 0' } : {}) }}
                onClick={() => setMemberPortalTab('ledger')}
              >
                Ledger Details
              </button>
            </div>

            {memberPortalTab === 'receipts' && (
            <>
            {/* Receipt Search Form */}
            <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
              <form onSubmit={handleReceiptSearch} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                  
                  {/* Staff Number / Phone / Name */}
                  <div style={{ position: 'relative' }}>
                    <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                      Staff / HRMS No., Phone, or Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 1001, phone number, or name"
                      className="form-input"
                      value={searchStaffNo}
                      autoComplete="off"
                      onChange={(e) => { setSearchStaffNo(e.target.value); setShowSuggestions(true); }}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                    />
                    {showSuggestions && searchSuggestions.length > 0 && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px', background: '#fff', border: '1px solid var(--surface-border)', borderRadius: '8px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)', zIndex: 20, maxHeight: '220px', overflowY: 'auto' }}>
                        {searchSuggestions.map((m) => (
                          <button
                            key={m.staffNo}
                            type="button"
                            onMouseDown={() => handleSelectMatch(m.staffNo)}
                            style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '10px 12px', background: 'none', border: 'none', borderBottom: '1px solid var(--surface-border)', cursor: 'pointer', fontSize: '13px', textAlign: 'left', color: '#0f172a' }}
                          >
                            <span>{m.name}</span>
                            <span style={{ color: 'var(--text-secondary)' }}>{m.staffNo}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Year */}
                  <div>
                    <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                      Select Year
                    </label>
                    <select 
                      className="form-input"
                      value={searchYear}
                      onChange={(e) => setSearchYear(e.target.value)}
                    >
                      <option value="2026">2026</option>
                      <option value="2025">2025</option>
                      <option value="2024">2024</option>
                      <option value="2023">2023</option>
                      <option value="2022">2022</option>
                    </select>
                  </div>

                  {/* Month */}
                  <div>
                    <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                      Select Month
                    </label>
                    <select 
                      className="form-input"
                      value={searchMonth}
                      onChange={(e) => setSearchMonth(e.target.value)}
                    >
                      <option value="01">January</option>
                      <option value="02">February</option>
                      <option value="03">March</option>
                      <option value="04">April</option>
                      <option value="05">May</option>
                      <option value="06">June</option>
                      <option value="07">July</option>
                      <option value="08">August</option>
                      <option value="09">September</option>
                      <option value="10">October</option>
                      <option value="11">November</option>
                      <option value="12">December</option>
                    </select>
                  </div>

                </div>

                {searchError && !searchMultipleMatches && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '12px', borderRadius: '8px', color: 'var(--accent-red)' }}>
                    <AlertTriangle size={16} />
                    <span style={{ fontSize: '13px' }}>{searchError}</span>
                  </div>
                )}

                {searchMultipleMatches && (
                  <div style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '12px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--primary)', display: 'block', marginBottom: '8px' }}>{searchError}</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {searchMultipleMatches.map((m) => (
                        <button
                          key={m.staffNo}
                          type="button"
                          className="btn-secondary"
                          style={{ fontSize: '13px', padding: '8px 12px', textAlign: 'left', justifyContent: 'space-between', display: 'flex' }}
                          onClick={() => handleSelectMatch(m.staffNo)}
                        >
                          <span>{m.name}</span>
                          <span style={{ color: 'var(--text-secondary)' }}>Staff/HRMS No. {m.staffNo}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {searchNoLoanMember && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '12px', borderRadius: '8px', color: 'var(--primary)' }}>
                    <AlertTriangle size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
                    <div style={{ fontSize: '13px' }}>
                      <strong>No Loan</strong> — {searchNoLoanMember.name} (Staff/HRMS No. {searchNoLoanMember.staff_no}) has no loan on record, so there is no recovery receipt to show for any month.
                      {searchNoLoanMember.savings_balance != null && (
                        <div style={{ marginTop: '6px', color: 'var(--text-secondary)' }}>
                          Savings balance on file: ₹{searchNoLoanMember.savings_balance.toLocaleString()}
                          {searchNoLoanMember.savings_balance_date ? ` (as of ${searchNoLoanMember.savings_balance_date})` : ''}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start' }} disabled={searchLoading}>
                  {searchLoading ? 'Searching...' : 'Search Receipt'}
                </button>

              </form>
            </div>

            {/* Receipt Display */}
            {searchResult && (
              <div className="glass-panel animate-fade-in" style={{ padding: '32px', background: '#fff', color: '#0f172a', border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }} id="printable-receipt">
                
                {/* Print Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '16px', marginBottom: '24px' }}>
                  <div>
                    <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#1e3a8a' }}>
                      {settings.society_name ? settings.society_name.split(' ').slice(0, 3).join(' ') : 'ATD Credit & Supply'}
                    </h3>
                    <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#475569' }}>
                      {settings.society_name ? settings.society_name.split(' ').slice(3).join(' ') : 'Co-Operative Society Limited'}
                    </h4>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>{settings.address || 'Central Telephone Exchange Building, Shahpur Road, Ahmedabad'}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: '800', tracking: '0.05em' }}>RECOVERY RECEIPT</h2>
                    <span style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600' }}>
                      {searchMonth}/{searchYear}
                    </span>
                  </div>
                </div>

                {/* Member Details */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px', background: '#f8fafc', padding: '16px', borderRadius: '8px' }}>
                  <div>
                    <span style={{ display: 'block', fontSize: '11px', color: '#64748b' }}>MEMBER NAME</span>
                    <strong style={{ fontSize: '15px' }}>{searchResult.name}</strong>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '11px', color: '#64748b' }}>STAFF / HRMS NO</span>
                    <strong style={{ fontSize: '15px' }}>{searchResult.staff_no}</strong>
                  </div>
                </div>

                {/* Account Details Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#475569', fontSize: '13px' }}>
                      <th style={{ textAlign: 'left', padding: '10px 0' }}>Deduction Head</th>
                      <th style={{ textAlign: 'right', padding: '10px 0' }}>Amount (INR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 0', fontSize: '14px' }}>Savings Account Deposit Contribution</td>
                      <td style={{ textAlign: 'right', padding: '12px 0', fontWeight: '600' }}>₹{searchResult.savings_deposit.toLocaleString()}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 0', fontSize: '14px' }}>Loan Principal Repayment</td>
                      <td style={{ textAlign: 'right', padding: '12px 0', fontWeight: '600' }}>₹{searchResult.loan_recovery.toLocaleString()}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #0f172a' }}>
                      <td style={{ padding: '12px 0', fontSize: '14px' }}>Loan Interest Recovery</td>
                      <td style={{ textAlign: 'right', padding: '12px 0', fontWeight: '600' }}>₹{searchResult.interest_recovery.toLocaleString()}</td>
                    </tr>
                    <tr style={{ background: '#f8fafc', fontWeight: '700' }}>
                      <td style={{ padding: '14px 10px', fontSize: '15px' }}>Net Recovered Amount</td>
                      <td style={{ textAlign: 'right', padding: '14px 10px', fontSize: '16px', color: '#1e3a8a' }}>₹{searchResult.total_recovered.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Footer notes */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '30px' }}>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    <p>• Generated electronically on {new Date().toLocaleDateString()}</p>
                    <p>• For queries contact office at Central Telephone Exchange.</p>
                  </div>
                  <div style={{ textAlign: 'center', width: '150px' }}>
                    <div style={{ borderBottom: '1px solid #94a3b8', height: '40px' }}></div>
                    <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginTop: '6px' }}>Authorized Signatory</span>
                  </div>
                </div>

                {/* Print button (non-printable in css) */}
                <div style={{ marginTop: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }} className="no-print">
                  <button
                    className="btn-primary"
                    style={{ background: '#1e3a8a', color: '#fff' }}
                    onClick={() => window.print()}
                  >
                    Print Receipt
                  </button>
                  <button
                    className="btn-primary"
                    style={{ background: '#25D366', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    onClick={handleShareWhatsApp}
                  >
                    <MessageSquare size={16} /> Send via WhatsApp
                  </button>
                  <button
                    className="btn-secondary"
                    style={{ border: '1px solid #cbd5e1', color: '#0f172a' }}
                    onClick={() => setSearchResult(null)}
                  >
                    Close
                  </button>
                </div>
                {!searchResult.phone && (
                  <p className="no-print" style={{ fontSize: '11px', color: '#64748b', marginTop: '8px' }}>
                    No phone number on file for this member — WhatsApp will open with the message ready, but you'll need to pick the recipient manually.
                  </p>
                )}

              </div>
            )}
            </>
            )}

            {memberPortalTab === 'ledger' && (
            <>
            {/* Ledger Search Form */}
            <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
              <form onSubmit={handleLedgerSearch} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ position: 'relative', maxWidth: '400px' }}>
                  <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                    Staff / HRMS No., Phone, or Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1001, phone number, or name"
                    className="form-input"
                    value={ledgerSearchInput}
                    autoComplete="off"
                    onChange={(e) => { setLedgerSearchInput(e.target.value); setShowLedgerSuggestions(true); }}
                    onFocus={() => setShowLedgerSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowLedgerSuggestions(false), 150)}
                  />
                  {showLedgerSuggestions && ledgerSuggestions.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px', background: '#fff', border: '1px solid var(--surface-border)', borderRadius: '8px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)', zIndex: 20, maxHeight: '220px', overflowY: 'auto' }}>
                      {ledgerSuggestions.map((m) => (
                        <button
                          key={m.staffNo}
                          type="button"
                          onMouseDown={() => handleSelectLedgerMatch(m.staffNo)}
                          style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '10px 12px', background: 'none', border: 'none', borderBottom: '1px solid var(--surface-border)', cursor: 'pointer', fontSize: '13px', textAlign: 'left', color: '#0f172a' }}
                        >
                          <span>{m.name}</span>
                          <span style={{ color: 'var(--text-secondary)' }}>{m.staffNo}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {ledgerError && !ledgerMultipleMatches && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '12px', borderRadius: '8px', color: 'var(--accent-red)' }}>
                    <AlertTriangle size={16} />
                    <span style={{ fontSize: '13px' }}>{ledgerError}</span>
                  </div>
                )}

                {ledgerMultipleMatches && (
                  <div style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '12px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--primary)', display: 'block', marginBottom: '8px' }}>{ledgerError}</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {ledgerMultipleMatches.map((m) => (
                        <button
                          key={m.staffNo}
                          type="button"
                          className="btn-secondary"
                          style={{ fontSize: '13px', padding: '8px 12px', textAlign: 'left', justifyContent: 'space-between', display: 'flex' }}
                          onClick={() => handleSelectLedgerMatch(m.staffNo)}
                        >
                          <span>{m.name}</span>
                          <span style={{ color: 'var(--text-secondary)' }}>Staff/HRMS No. {m.staffNo}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start' }} disabled={ledgerLoading}>
                  {ledgerLoading ? 'Searching...' : 'Search Ledger'}
                </button>
              </form>
            </div>

            {/* Ledger Result */}
            {ledgerResult && (
              <div className="glass-panel animate-fade-in" style={{ padding: '24px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid var(--surface-border)', paddingBottom: '16px', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '18px' }}>{ledgerResult.member.name}</h3>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Staff/HRMS No. {ledgerResult.member.staff_no}{ledgerResult.member.phone ? ` • ${ledgerResult.member.phone}` : ''}
                    </span>
                  </div>
                  {ledgerResult.member.savings_balance != null && (
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)' }}>SAVINGS BALANCE</span>
                      <strong style={{ fontSize: '15px' }}>₹{ledgerResult.member.savings_balance.toLocaleString()}</strong>
                    </div>
                  )}
                </div>

                {ledgerResult.loans.length === 0 ? (
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>No loan on record for this member.</p>
                ) : (
                  ledgerResult.loans.map((loan) => (
                    <div key={loan.id} style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.15)', padding: '14px', borderRadius: '8px', marginBottom: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                      <div>
                        <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)' }}>LOAN AMOUNT</span>
                        <strong style={{ fontSize: '14px' }}>₹{loan.loan_amount.toLocaleString()}</strong>
                      </div>
                      <div>
                        <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)' }}>REMAINING BALANCE</span>
                        <strong style={{ fontSize: '14px', color: 'var(--primary)' }}>₹{loan.remaining_balance.toLocaleString()}</strong>
                      </div>
                      {loan.guarantor1_name && (
                        <div>
                          <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)' }}>GUARANTOR 1</span>
                          <strong style={{ fontSize: '14px' }}>{loan.guarantor1_name}</strong>
                        </div>
                      )}
                      {loan.guarantor2_name && (
                        <div>
                          <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)' }}>GUARANTOR 2</span>
                          <strong style={{ fontSize: '14px' }}>{loan.guarantor2_name}</strong>
                        </div>
                      )}
                    </div>
                  ))
                )}

                <h4 style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Payment History ({ledgerResult.receipts.length})</h4>
                {ledgerResult.receipts.length === 0 ? (
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>No receipts on file for this member.</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--surface-border)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                          <th style={{ padding: '8px 6px' }}>Month</th>
                          <th style={{ padding: '8px 6px' }}>Receipt No.</th>
                          <th style={{ padding: '8px 6px', textAlign: 'right' }}>Savings</th>
                          <th style={{ padding: '8px 6px', textAlign: 'right' }}>Installment</th>
                          <th style={{ padding: '8px 6px', textAlign: 'right' }}>Interest</th>
                          <th style={{ padding: '8px 6px', textAlign: 'right' }}>Total</th>
                          <th style={{ padding: '8px 6px', textAlign: 'right' }}>Loan Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ledgerResult.receipts.map((r) => (
                          <tr key={r.id} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                            <td style={{ padding: '8px 6px', fontWeight: '600' }}>{r.month}/{r.year}</td>
                            <td style={{ padding: '8px 6px', color: 'var(--text-secondary)' }}>{r.receipt_no || '—'}</td>
                            <td style={{ padding: '8px 6px', textAlign: 'right' }}>₹{r.savings_deposit.toLocaleString()}</td>
                            <td style={{ padding: '8px 6px', textAlign: 'right' }}>₹{r.loan_recovery.toLocaleString()}</td>
                            <td style={{ padding: '8px 6px', textAlign: 'right' }}>₹{r.interest_recovery.toLocaleString()}</td>
                            <td style={{ padding: '8px 6px', textAlign: 'right', fontWeight: '600' }}>₹{r.total_recovered.toLocaleString()}</td>
                            <td style={{ padding: '8px 6px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                              {r.loan_balance_after != null ? `₹${r.loan_balance_after.toLocaleString()}` : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
            </>
            )}

          </div>
        )}

        {/* ==================================== */}
        {/* 3. ADMIN PANEL                       */}
        {/* ==================================== */}
        {activeTab === 'admin' && (
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            
            {/* Login Overlay if not authenticated */}
            {!adminLoggedIn ? (
              <div style={{ maxWidth: '400px', margin: '60px auto' }}>
                <div className="glass-panel" style={{ padding: '32px' }}>
                  <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <div style={{ display: 'inline-flex', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', padding: '12px', borderRadius: '12px', marginBottom: '12px' }}>
                      <ShieldAlert size={32} />
                    </div>
                    <h2 style={{ fontSize: '22px' }}>Admin Secure Authentication</h2>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Login to manage society accounts and data backups</p>
                  </div>

                  <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Username</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="admin" 
                        value={adminUsername}
                        onChange={(e) => setAdminUsername(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Password</label>
                      <input 
                        type="password" 
                        className="form-input" 
                        placeholder="••••••••" 
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        required
                      />
                    </div>

                    {adminError && (
                      <p style={{ fontSize: '12px', color: 'var(--accent-red)' }}>{adminError}</p>
                    )}

                    <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                      Authenticate
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              // Authenticated Admin Dashboard
              <div>
                
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
                  <div>
                    <h2 style={{ fontSize: '28px', color: 'var(--text-primary)' }}>Society Admin Workspace</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Upload member statements and manage database backups</p>
                  </div>
                  <button className="btn-secondary" onClick={() => setAdminLoggedIn(false)}>
                    Lock Panel
                  </button>
                </div>

                {/* Admin Sub-navigation Tabs */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1.5px solid var(--surface-border)', paddingBottom: '12px', flexWrap: 'wrap' }}>
                  <button 
                    className={`btn-secondary ${adminTab === 'upload' ? 'active-nav-btn' : ''}`}
                    style={{ fontSize: '13px', padding: '8px 16px' }}
                    onClick={() => setAdminTab('upload')}
                  >
                    <Users size={14} /> Directory & Uploads
                  </button>
                  <button 
                    className={`btn-secondary ${adminTab === 'backups' ? 'active-nav-btn' : ''}`}
                    style={{ fontSize: '13px', padding: '8px 16px' }}
                    onClick={() => setAdminTab('backups')}
                  >
                    <Database size={14} /> Database Backups
                  </button>
                  <button 
                    className={`btn-secondary ${adminTab === 'board' ? 'active-nav-btn' : ''}`}
                    style={{ fontSize: '13px', padding: '8px 16px' }}
                    onClick={() => setAdminTab('board')}
                  >
                    <Sparkles size={14} /> Board of Directors
                  </button>
                  <button 
                    className={`btn-secondary ${adminTab === 'settings' ? 'active-nav-btn' : ''}`}
                    style={{ fontSize: '13px', padding: '8px 16px' }}
                    onClick={() => setAdminTab('settings')}
                  >
                    <ShieldAlert size={14} /> System Settings
                  </button>
                </div>

                {/* Tab content rendering */}
                {adminTab === 'upload' && (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px', marginBottom: '24px' }}>
                      {/* Account Data Import Module */}
                      <div className="glass-panel" style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderBottom: '1px solid var(--surface-border)', paddingBottom: '12px' }}>
                          <Upload size={20} style={{ color: 'var(--primary)' }} />
                          <h3 style={{ fontSize: '18px' }}>Upload Accounts Sheet</h3>
                        </div>

                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                          Upload XLS, XLSX, CSV, or Text-formatted PDF sheets to insert or update member accounts. Columns: `staff_no`, `name`, `year`, `month`, `savings_deposit`, `loan_recovery`, `interest_recovery`, `receipt_no`.
                        </p>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px', background: 'rgba(0,0,0,0.02)', border: '1px solid var(--surface-border)', borderRadius: '8px', padding: '10px 14px' }}>
                          Monthly entries: for regular savings, salary-deducted loan repayments, and other-method (cheque/online) repayments, upload each as its own row with a distinct <code>receipt_no</code> (e.g. "SAVINGS", "SALARY", or the actual receipt number) — they'll add up instead of overwriting each other. Loan repayments automatically reduce that member's outstanding loan balance.
                        </p>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', background: 'rgba(0,0,0,0.02)', border: '1px solid var(--surface-border)', borderRadius: '8px', padding: '10px 14px' }}>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Not sure of the format?</span>
                          <a href="/api/upload-data/template?format=csv" download style={{ fontSize: '12px', fontWeight: '600', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
                            <Download size={12} /> CSV Template
                          </a>
                          <a href="/api/upload-data/template?format=xlsx" download style={{ fontSize: '12px', fontWeight: '600', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
                            <Download size={12} /> XLSX Template
                          </a>
                        </div>

                        <form onSubmit={handleFileUpload} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <div style={{ border: '2px dashed var(--surface-border)', padding: '24px', borderRadius: '8px', textAlign: 'center', cursor: 'pointer', background: 'rgba(0,0,0,0.01)' }} onClick={() => document.getElementById('file-upload-input').click()}>
                            <FileText size={32} style={{ color: 'var(--text-secondary)', marginBottom: '8px', opacity: 0.6 }} />
                            <span style={{ display: 'block', fontSize: '14px' }}>
                              {uploadFile ? uploadFile.name : 'Select statement file (CSV, XLSX, PDF)'}
                            </span>
                            <input 
                              type="file" 
                              id="file-upload-input" 
                              style={{ display: 'none' }} 
                              accept=".csv,.xlsx,.xls,.pdf"
                              onChange={(e) => setUploadFile(e.target.files[0])}
                            />
                          </div>

                          {uploadError && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '12px', borderRadius: '8px', color: 'var(--accent-red)' }}>
                              <AlertTriangle size={16} />
                              <span style={{ fontSize: '13px' }}>{uploadError}</span>
                            </div>
                          )}

                          {uploadSuccess && (
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '12px', borderRadius: '8px', color: 'var(--secondary)' }}>
                              <CheckCircle2 size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
                              <div>
                                <pre style={{ fontSize: '12px', fontFamily: 'var(--font-body)', whiteSpace: 'pre-wrap', margin: 0 }}>{uploadSuccess}</pre>
                                {uploadUsedAI && (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '6px', fontSize: '11px', fontWeight: '600', color: 'var(--primary)', background: 'rgba(59, 130, 246, 0.12)', padding: '3px 8px', borderRadius: '999px' }}>
                                    <Sparkles size={11} /> Parsed with AI
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start' }} disabled={uploadLoading}>
                            {uploadLoading ? 'Uploading and Processing...' : 'Upload & Process Sheet'}
                          </button>
                        </form>
                      </div>

                      {/* AI-Assisted Parsing (Claude) Panel */}
                      <div className="glass-panel" style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderBottom: '1px solid var(--surface-border)', paddingBottom: '12px' }}>
                          <Sparkles size={20} style={{ color: 'var(--primary)' }} />
                          <h3 style={{ fontSize: '18px' }}>AI-Assisted Parsing (Claude)</h3>
                        </div>

                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                          When enabled, PDF and Excel uploads are read by Claude instead of the fixed-format parser, so inconsistent headers, merged cells, or irregular layouts still get mapped correctly. CSV uploads always use the standard parser. If AI parsing fails for any reason, the upload automatically falls back to the standard parser.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>API Key</span>
                            <span style={{ fontWeight: '600', color: aiStatus.configured ? 'var(--secondary)' : 'var(--accent-red)' }}>
                              {aiStatus.configured ? 'Configured' : 'Not Configured'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Model</span>
                            <span style={{ fontWeight: '600' }}>{aiStatus.model || '—'}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>AI Parsing for Uploads</span>
                            <span style={{ fontWeight: '600', color: aiStatus.enabled ? 'var(--secondary)' : 'var(--text-secondary)' }}>
                              {aiStatus.enabled ? 'ON' : 'OFF'}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            className="btn-primary"
                            style={{ fontSize: '13px', padding: '8px 16px' }}
                            onClick={handleToggleAI}
                            disabled={aiToggleLoading || !aiStatus.configured}
                            title={!aiStatus.configured ? 'Set ANTHROPIC_API_KEY on the server to enable this' : ''}
                          >
                            {aiToggleLoading ? 'Updating...' : (aiStatus.enabled ? 'Turn AI Parsing Off' : 'Turn AI Parsing On')}
                          </button>
                          <button
                            type="button"
                            className="btn-secondary"
                            style={{ fontSize: '13px', padding: '8px 16px' }}
                            onClick={handleTestAI}
                            disabled={aiTestLoading}
                          >
                            {aiTestLoading ? 'Testing...' : 'Test Connection'}
                          </button>
                        </div>

                        {aiTestResult && (
                          <div style={{
                            marginTop: '14px',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '8px',
                            background: aiTestResult.ok ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            border: `1px solid ${aiTestResult.ok ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                            padding: '12px',
                            borderRadius: '8px',
                            color: aiTestResult.ok ? 'var(--secondary)' : 'var(--accent-red)'
                          }}>
                            {aiTestResult.ok ? <CheckCircle2 size={16} style={{ marginTop: '2px', flexShrink: 0 }} /> : <AlertTriangle size={16} style={{ marginTop: '2px', flexShrink: 0 }} />}
                            <span style={{ fontSize: '13px' }}>
                              {aiTestResult.ok
                                ? `Connection OK — ${aiTestResult.model} responded successfully.`
                                : (aiTestResult.error || 'Connection failed.')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Society Workbook Importer (members details + ledger format) */}
                    <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderBottom: '1px solid var(--surface-border)', paddingBottom: '12px' }}>
                        <Database size={20} style={{ color: 'var(--secondary)' }} />
                        <h3 style={{ fontSize: '18px' }}>Import Society Workbook</h3>
                      </div>

                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                        For the specific "members details" + "ledger" workbook format the society office maintains manually — not the generic CSV/Excel template above. Always preview before importing.
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
                        <input
                          type="file"
                          accept=".xlsx,.xls"
                          onChange={(e) => { setSocietyFile(e.target.files[0]); setSocietyPreview(null); setSocietyImportResult(null); setSocietyError(''); }}
                          style={{ fontSize: '13px' }}
                        />
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ fontSize: '13px', padding: '8px 16px' }}
                          onClick={handlePreviewSocietyWorkbook}
                          disabled={societyPreviewLoading || !societyFile}
                        >
                          {societyPreviewLoading ? 'Previewing...' : 'Preview (Dry Run)'}
                        </button>
                      </div>

                      {societyError && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '12px', borderRadius: '8px', color: 'var(--accent-red)', marginBottom: '16px' }}>
                          <AlertTriangle size={16} />
                          <span style={{ fontSize: '13px' }}>{societyError}</span>
                        </div>
                      )}

                      {societyPreview && (
                        <div style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                          <strong style={{ fontSize: '13px', display: 'block', marginBottom: '10px' }}>Preview — nothing has been written yet</strong>
                          <div style={{ display: 'flex', gap: '24px', marginBottom: '10px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '13px' }}><strong>{societyPreview.memberCount}</strong> members</span>
                            <span style={{ fontSize: '13px' }}><strong>{societyPreview.receiptCount}</strong> receipts</span>
                            <span style={{ fontSize: '13px' }}><strong>{societyPreview.orphanMembers?.length || 0}</strong> former/orphan members</span>
                          </div>
                          {societyPreview.issues && societyPreview.issues.length > 0 && (
                            <div style={{ marginBottom: '12px' }}>
                              <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--accent-gold)', display: 'block', marginBottom: '4px' }}>Flagged for review:</span>
                              <ul style={{ fontSize: '12px', color: 'var(--text-secondary)', paddingLeft: '18px', margin: 0 }}>
                                {societyPreview.issues.map((issue, idx) => <li key={idx} style={{ marginBottom: '4px' }}>{issue}</li>)}
                              </ul>
                            </div>
                          )}
                          <button
                            type="button"
                            className="btn-primary"
                            style={{ fontSize: '13px', padding: '8px 16px' }}
                            onClick={handleConfirmSocietyImport}
                            disabled={societyImporting}
                          >
                            {societyImporting ? 'Importing...' : 'Confirm & Import'}
                          </button>
                        </div>
                      )}

                      {societyImportResult && (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '12px', borderRadius: '8px', color: 'var(--secondary)' }}>
                          <CheckCircle2 size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
                          <span style={{ fontSize: '13px' }}>
                            Imported — {societyImportResult.stats.membersInserted} new / {societyImportResult.stats.membersUpdated} updated members,{' '}
                            {societyImportResult.stats.loansInserted} new / {societyImportResult.stats.loansUpdated} updated loans,{' '}
                            {societyImportResult.stats.receiptsUpserted} receipts, {societyImportResult.stats.orphanMembersCreated} former members added as inactive.
                            {societyImportResult.stats.errors.length > 0 && ` ${societyImportResult.stats.errors.length} row(s) failed — check server logs.`}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Member Directory Panel */}
                    <div className="glass-panel" style={{ padding: '24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderBottom: '1px solid var(--surface-border)', paddingBottom: '12px' }}>
                        <Users size={20} style={{ color: 'var(--accent-gold)' }} />
                        <h3 style={{ fontSize: '18px' }}>Society Members Directory</h3>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
                        {/* Left: Members List */}
                        <div style={{ borderRight: '1px solid var(--surface-border)', paddingRight: '20px', maxHeight: '350px', overflowY: 'auto' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {members.map((m) => (
                              <div 
                                key={m.id}
                                style={{ 
                                  padding: '10px 14px', 
                                  borderRadius: '8px', 
                                  background: selectedMemberSummary?.member?.id === m.id ? 'rgba(59, 130, 246, 0.12)' : 'rgba(0,0,0,0.01)', 
                                  border: selectedMemberSummary?.member?.id === m.id ? '1px solid var(--primary)' : '1px solid var(--surface-border)',
                                  cursor: 'pointer'
                                }}
                                onClick={() => fetchMemberSummary(m.staff_no)}
                              >
                                <strong style={{ display: 'block', fontSize: '13px' }}>{m.name}</strong>
                                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Staff No: {m.staff_no}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Right: Selected Member Detail (Loans & Receipts Summary) */}
                        <div>
                          {selectedMemberSummary ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--surface-border)', paddingBottom: '8px' }}>
                                <h4 style={{ fontSize: '16px' }}>{selectedMemberSummary.member.name}</h4>
                                <span style={{ fontSize: '12px', background: 'rgba(0,0,0,0.05)', padding: '2px 8px', borderRadius: '4px' }}>
                                  Staff No: {selectedMemberSummary.member.staff_no}
                                </span>
                              </div>

                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                {/* Contact Info */}
                                <div>
                                  <h5 style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Contact Info</h5>
                                  <p style={{ fontSize: '13px' }}>📧 {selectedMemberSummary.member.email || 'N/A'}</p>
                                  <p style={{ fontSize: '13px' }}>📞 {selectedMemberSummary.member.phone || 'N/A'}</p>
                                </div>
                                
                                {/* Active Loans */}
                                <div>
                                  <h5 style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Active Loans</h5>
                                  {selectedMemberSummary.loans.length === 0 ? (
                                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>No active loans</p>
                                  ) : (
                                    selectedMemberSummary.loans.map((l) => (
                                      <div key={l.id} style={{ fontSize: '12px' }}>
                                        • {l.loan_type} (Bal: <strong>₹{l.remaining_balance.toLocaleString()}</strong>)
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>

                              {/* Receipts Summary */}
                              <div>
                                <h5 style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Recovery Records</h5>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                  {selectedMemberSummary.receipts.map((r) => (
                                    <span 
                                      key={r.id}
                                      style={{ background: 'rgba(0,0,0,0.02)', border: '1px solid var(--surface-border)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px' }}
                                    >
                                      {r.month}/{r.year}: <strong>₹{r.total_recovered.toLocaleString()}</strong>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
                              <User size={32} style={{ opacity: 0.4, marginBottom: '8px' }} />
                              <p style={{ fontSize: '13px' }}>Select a member from the directory list to inspect details</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {adminTab === 'backups' && (
                  <div className="glass-panel" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderBottom: '1px solid var(--surface-border)', paddingBottom: '12px' }}>
                      <Database size={20} style={{ color: 'var(--secondary)' }} />
                      <h3 style={{ fontSize: '18px' }}>Database Snapshot Backups</h3>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.15)', padding: '12px', borderRadius: '8px' }}>
                      <div>
                        <strong style={{ fontSize: '13px', display: 'block', color: 'var(--accent-green)' }}>FORTNIGHTLY SCHEDULER ACTIVE</strong>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Automated DB file snapshots taken every 14 days</span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <a 
                          href="/api/backups/export" 
                          className="btn-secondary" 
                          style={{ fontSize: '13px', padding: '6px 12px', textDecoration: 'none' }}
                          title="Export all database tables to a portable JSON file"
                          download
                        >
                          <Download size={14} /> Export JSON Data
                        </a>
                        <button className="btn-primary" onClick={triggerManualBackup} disabled={backupLoading} style={{ fontSize: '13px', padding: '6px 12px' }}>
                          {backupLoading ? 'Backing up...' : 'Trigger Backup Now'}
                        </button>
                      </div>
                    </div>

                    {backupMessage && (
                      <p style={{ fontSize: '12px', color: 'var(--accent-gold)', marginBottom: '12px' }}>{backupMessage}</p>
                    )}

                    <div style={{ marginBottom: '20px', background: 'rgba(0,0,0,0.02)', border: '1px solid var(--surface-border)', padding: '14px', borderRadius: '8px' }}>
                      <strong style={{ fontSize: '13px', display: 'block', marginBottom: '10px' }}>Offsite Backup Destinations</strong>
                      <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                        Every backup (fortnightly or manual) also uploads a JSON snapshot here — outside Railway's database, so it survives even if the Postgres database itself is lost.
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Railway Bucket</span>
                          <span style={{ fontWeight: '600', color: offsiteStatus.bucketConfigured ? 'var(--secondary)' : 'var(--accent-red)' }}>
                            {offsiteStatus.bucketConfigured ? 'Configured' : 'Not Configured'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Email</span>
                          <span style={{ fontWeight: '600', color: offsiteStatus.emailConfigured ? 'var(--secondary)' : 'var(--accent-red)' }}>
                            {offsiteStatus.emailConfigured ? 'Configured' : 'Not Configured'}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ fontSize: '12px', padding: '6px 12px' }}
                        onClick={handleTestEmail}
                        disabled={emailTestLoading}
                      >
                        {emailTestLoading ? 'Testing...' : 'Test Email Connection'}
                      </button>
                      {emailTestResult && (
                        <p style={{ fontSize: '11px', marginTop: '8px', color: emailTestResult.ok ? 'var(--secondary)' : 'var(--accent-red)' }}>
                          {emailTestResult.ok ? `Connection OK — backups will be emailed to ${emailTestResult.to}.` : (emailTestResult.error || 'Connection failed.')}
                        </p>
                      )}
                    </div>

                    <div style={{ marginBottom: '20px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '14px', borderRadius: '8px' }}>
                      <strong style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-red)', marginBottom: '6px' }}>
                        <AlertTriangle size={14} /> Restore from Backup File
                      </strong>
                      <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                        Upload a JSON file previously downloaded via "Export JSON Data" to recover the database — for example, after the Railway database is lost or corrupted. This <strong>deletes all current data</strong> (members, receipts, loans, board members, settings) and replaces it with the backup's contents. Cannot be undone.
                      </p>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <input
                          type="file"
                          accept="application/json,.json"
                          onChange={(e) => setRestoreFile(e.target.files[0])}
                          style={{ fontSize: '12px' }}
                        />
                        <button
                          className="btn-secondary"
                          style={{ fontSize: '12px', padding: '6px 12px', color: 'var(--accent-red)', borderColor: 'rgba(239,68,68,0.3)' }}
                          onClick={handleRestoreBackup}
                          disabled={restoreLoading || !restoreFile}
                        >
                          {restoreLoading ? 'Restoring...' : 'Restore from This File'}
                        </button>
                      </div>
                      {restoreMessage && (
                        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '8px' }}>{restoreMessage}</p>
                      )}
                    </div>

                    <h4 style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Recent Backup Logs</h4>
                    
                    <div style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
                      {backups.length === 0 ? (
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>No backups created yet.</p>
                      ) : (
                        backups.map((b) => (
                          <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.01)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--surface-border)', fontSize: '12px' }}>
                            <div>
                              <strong style={{ display: 'block', color: 'var(--text-primary)', fontSize: '12px' }}>{b.filename}</strong>
                              <span style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>
                                {new Date(b.backup_time).toLocaleString()} • {b.size > 0 ? `${Math.round(b.size / 1024)} KB` : 'Cloud Snapshot'}
                              </span>
                            </div>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <span style={{ alignSelf: 'center', background: b.status === 'SUCCESS' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: b.status === 'SUCCESS' ? 'var(--accent-green)' : 'var(--accent-red)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: '700' }}>
                                {b.status}
                              </span>
                              {b.status === 'SUCCESS' && (
                                <a
                                  href={`/api/backups/download/${b.filename}`}
                                  className="btn-secondary"
                                  style={{ padding: '4px', borderRadius: '4px' }}
                                  title="Download this backup file"
                                  download
                                >
                                  <Download size={12} />
                                </a>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {adminTab === 'board' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
                    {/* Add/Edit Director Form */}
                    <div className="glass-panel" style={{ padding: '24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderBottom: '1px solid var(--surface-border)', paddingBottom: '12px' }}>
                        <Sparkles size={20} style={{ color: 'var(--primary)' }} />
                        <h3 style={{ fontSize: '18px' }}>{editingDirector ? 'Edit Board Member' : 'Add Board Member'}</h3>
                      </div>
                      
                      <form onSubmit={handleSaveDirector} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                          <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Full Name</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            placeholder="e.g. Mahendrakumar Solanki"
                            value={directorName}
                            onChange={(e) => setDirectorName(e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Photograph</label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {directorPhotoPreview && (
                              <img
                                src={directorPhotoPreview}
                                alt="Preview"
                                style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--surface-border)' }}
                              />
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              className="form-input"
                              onChange={handleDirectorPhotoChange}
                              style={{ flex: 1 }}
                            />
                          </div>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            Optional — falls back to the initials avatar below if no photo is set. Max 2MB.
                          </span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div>
                            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Role / Designation</label>
                            <input 
                              type="text" 
                              className="form-input" 
                              placeholder="e.g. Chairman"
                              value={directorRole}
                              onChange={(e) => setDirectorRole(e.target.value)}
                              required
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Initials (Avatar)</label>
                            <input 
                              type="text" 
                              className="form-input" 
                              placeholder="e.g. MS"
                              value={directorInitials}
                              onChange={(e) => setDirectorInitials(e.target.value)}
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Display Order</label>
                          <input 
                            type="number" 
                            className="form-input" 
                            placeholder="e.g. 1"
                            value={directorOrder}
                            onChange={(e) => setDirectorOrder(e.target.value)}
                          />
                        </div>
                        
                        {directorMessage && (
                          <p style={{ fontSize: '12px', color: 'var(--accent-gold)' }}>{directorMessage}</p>
                        )}

                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button type="submit" className="btn-primary" style={{ fontSize: '13px', padding: '8px 16px' }}>
                            {editingDirector ? 'Save Changes' : 'Add Member'}
                          </button>
                          {editingDirector && (
                            <button 
                              type="button" 
                              className="btn-secondary" 
                              style={{ fontSize: '13px', padding: '8px 16px' }}
                              onClick={() => {
                                setEditingDirector(null);
                                setDirectorName('');
                                setDirectorRole('');
                                setDirectorInitials('');
                                setDirectorOrder('0');
                                setDirectorPhotoFile(null);
                                setDirectorPhotoPreview('');
                              }}
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </form>
                    </div>

                    {/* Board List */}
                    <div className="glass-panel" style={{ padding: '24px' }}>
                      <h3 style={{ fontSize: '18px', marginBottom: '16px', borderBottom: '1px solid var(--surface-border)', paddingBottom: '12px' }}>Current Board Members</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '350px', overflowY: 'auto' }}>
                        {boardMembers.length === 0 ? (
                          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>No directors listed.</p>
                        ) : (
                          boardMembers.map((b) => (
                            <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.01)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', overflow: 'hidden', flexShrink: 0 }}>
                                  {b.photo_url ? (
                                    <img src={b.photo_url} alt={b.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  ) : (
                                    b.initials
                                  )}
                                </div>
                                <div>
                                  <strong style={{ fontSize: '13.5px' }}>{b.name}</strong>
                                  <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)' }}>
                                    {b.role} • Order: {b.display_order}
                                  </span>
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => startEditDirector(b)}>
                                  Edit
                                </button>
                                <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: '11px', color: 'var(--accent-red)', borderColor: 'rgba(239,68,68,0.2)' }} onClick={() => handleDeleteDirector(b.id)}>
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {adminTab === 'settings' && (
                  <div className="glass-panel" style={{ padding: '24px', maxWidth: '600px', margin: '0 auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderBottom: '1px solid var(--surface-border)', paddingBottom: '12px' }}>
                      <ShieldAlert size={20} style={{ color: 'var(--primary)' }} />
                      <h3 style={{ fontSize: '18px' }}>Society System Brand Settings</h3>
                    </div>
                    
                    <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div>
                        <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Society Full Name</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          value={editSocietyName}
                          onChange={(e) => setEditSocietyName(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Office Address</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          value={editAddress}
                          onChange={(e) => setEditAddress(e.target.value)}
                          required
                        />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                        <div>
                          <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Phone / Helpline</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Email Address</label>
                          <input 
                            type="email" 
                            className="form-input" 
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                        <div>
                          <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Year Established</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            value={editEstablishedYear}
                            onChange={(e) => setEditEstablishedYear(e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Loan Interest Rate (%)</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            value={editInterestRate}
                            onChange={(e) => setEditInterestRate(e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Max PMT Loan Amount (₹)</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            value={editMaxPmtAmount}
                            onChange={(e) => setEditMaxPmtAmount(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      {settingsMessage && (
                        <p style={{ fontSize: '12px', color: 'var(--primary)' }}>{settingsMessage}</p>
                      )}

                      <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start' }}>
                        Save Brand Settings
                      </button>
                    </form>
                  </div>
                )}

              </div>
            )}

          </div>
        )}

      </main>

      {/* --- WHATSAPP BOT CHAT SIMULATOR TRIGGER (FLOATING BUTTON) --- */}
      <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000 }}>
        <button 
          onClick={() => setShowWhatsappBot(!showWhatsappBot)}
          style={{ 
            background: '#25d366', 
            color: '#fff', 
            border: 'none', 
            width: '60px', 
            height: '60px', 
            borderRadius: '50%', 
            cursor: 'pointer', 
            boxShadow: '0 8px 24px rgba(37, 211, 102, 0.4)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            position: 'relative'
          }}
          className="btn-primary"
          title="Toggle WhatsApp Bot Simulator"
        >
          {showWhatsappBot ? <X size={28} /> : <MessageSquare size={28} />}
          {!showWhatsappBot && (
            <span style={{ position: 'absolute', top: '-4px', right: '-4px', display: 'flex', height: '20px', width: '20px' }}>
              <span style={{ position: 'absolute', display: 'inline-flex', height: '100%', width: '100%', borderRadius: '50%', background: '#ff3b30', opacity: 0.75, animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite' }}></span>
              <span style={{ position: 'relative', display: 'inline-flex', borderRadius: '50%', height: '20px', width: '20px', background: '#ff3b30', color: '#fff', fontSize: '10px', alignItems: 'center', justifyContent: 'center', fontWeight: '800' }}>1</span>
            </span>
          )}
        </button>
      </div>

      {/* --- WHATSAPP CHAT DRAWER PANEL --- */}
      {showWhatsappBot && (
        <div 
          className="glass-panel animate-fade-in"
          style={{ 
            position: 'fixed', 
            bottom: '96px', 
            right: '24px', 
            width: '380px', 
            height: '520px', 
            zIndex: 1000, 
            display: 'grid', 
            gridTemplateRows: 'auto 1fr auto', 
            overflow: 'hidden', 
            background: '#ece5dd', // WhatsApp background color
            border: '1px solid #128c7e',
            color: '#000'
          }}
        >
          
          {/* Top Green Header */}
          <div style={{ background: '#075e54', color: '#fff', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#fff', color: '#075e54', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '18px' }}>
              {settings.society_name ? settings.society_name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() : 'AT'}
            </div>
            <div>
              <h4 style={{ fontSize: '15px', color: '#fff' }}>{settings.society_name ? settings.society_name.split(' ').slice(0, 2).join(' ') : 'ATD Society'} Assist Bot</h4>
              <span style={{ fontSize: '11px', color: '#dcf8c6', display: 'block' }}>Online Bot Simulator</span>
            </div>
          </div>

          {/* Messages Area */}
          <div style={{ padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            {chatMessages.map((msg, idx) => (
              <div 
                key={idx}
                style={{
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  background: msg.sender === 'user' ? '#dcf8c6' : '#fff',
                  padding: '8px 12px',
                  borderRadius: msg.sender === 'user' ? '8px 0px 8px 8px' : '0px 8px 8px 8px',
                  maxWidth: '85%',
                  boxShadow: '0 1px 1px rgba(0,0,0,0.1)',
                  fontSize: '13.5px',
                  lineHeight: 1.4,
                  wordBreak: 'break-word'
                }}
              >
                <div 
                  style={{ whiteSpace: 'pre-wrap' }}
                  dangerouslySetInnerHTML={{ 
                    __html: msg.text
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
                      .replace(/`(.*?)`/g, '<code style="background: rgba(0,0,0,0.06); padding: 2px 4px; borderRadius: 4px;">$1</code>')
                  }}
                />
                <span style={{ display: 'block', fontSize: '9px', color: '#999', textAlign: 'right', marginTop: '4px' }}>
                  {msg.time}
                </span>
              </div>
            ))}

            {isTyping && (
              <div style={{ alignSelf: 'flex-start', background: '#fff', padding: '8px 12px', borderRadius: '0px 8px 8px 8px', fontSize: '12px', color: '#888', fontStyle: 'italic' }}>
                Bot typing...
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          {/* Bottom input area */}
          <form 
            onSubmit={handleSendChatMessage}
            style={{ 
              background: '#f0f0f0', 
              padding: '10px', 
              display: 'flex', 
              gap: '8px', 
              borderTop: '1px solid #ddd' 
            }}
          >
            <input 
              type="text" 
              className="form-input" 
              placeholder="Type message (e.g. hi, receipt 1001 07 2026)..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              style={{ background: '#fff', color: '#000', border: '1px solid #ccc', borderRadius: '20px', padding: '8px 16px' }}
            />
            <button 
              type="submit" 
              style={{ 
                background: '#075e54', 
                color: '#fff', 
                border: 'none', 
                width: '40px', 
                height: '40px', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              <Send size={18} />
            </button>
          </form>

        </div>
      )}

      {/* --- FOOTER COPYRIGHT --- */}
      <footer className="glass-panel" style={{ margin: '24px', padding: '16px', textAlign: 'center', borderRadius: '12px' }}>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
          &copy; {new Date().getFullYear()} {settings.society_name || 'ATD Credit & Supply Co-Operative Society Limited'}. All Rights Reserved. Designed and Developed by JK Data Lab.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', fontSize: '11px' }}>
          <a href="#about-sec" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>About</a>
          <span style={{ color: 'var(--surface-border)' }}>|</span>
          <a href="#contact-sec" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Contact</a>
          <span style={{ color: 'var(--surface-border)' }}>|</span>
          {adminLoggedIn ? (
            <button 
              onClick={() => { setAdminLoggedIn(false); setActiveTab('home'); }} 
              style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', fontSize: '11px', padding: 0 }}
            >
              Log Out Admin
            </button>
          ) : (
            <button 
              onClick={() => { setAdminUsername(''); setAdminPassword(''); setAdminError(''); setActiveTab('admin'); }} 
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '11px', padding: 0 }}
            >
              Admin Area
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
