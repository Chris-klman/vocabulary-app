import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from './components/layout';
import { DictionaryView } from './features/dictionary/DictionaryView';
import { LearningView } from './features/learning/LearningView';
import { VocabularyListView } from './features/vocabulary/VocabularyListView';
import { AssessmentView } from './features/assessment/AssessmentView';
import { ProfileView } from './features/profile/ProfileView';

// Create a Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<DictionaryView />} />
            <Route path="/dictionary" element={<Navigate to="/" replace />} />
            <Route path="/vocabulary" element={<VocabularyListView />} />
            <Route path="/assessment" element={<AssessmentView />} />
            <Route path="/learning" element={<LearningView />} />
            <Route path="/profile" element={<ProfileView />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
