import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';

// Mock client setup for demonstration (would use real supabase config in production)
const MOCK_STUDENTS = [
  { id: '1', name: 'Al-Mahbub TechSavvy', country: 'South Korea', status: 'Visa Approved' },
  { id: '2', name: 'Jannat Ara', country: 'Canada', status: 'Applied' },
  { id: '3', name: 'Yeasin Khan', country: 'Japan', status: 'Documents Collection' },
  { id: '4', name: 'Sumona Akter', country: 'USA', status: 'Enrolled' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('students'); // 'students' or 'calendar'
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    // Simulate loading data from Supabase backend client
    setTimeout(() => {
      setStudents(MOCK_STUDENTS);
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>GT Group CRM Mobile</Text>
        <Text style={styles.headerSubtitle}>Multi-Office Study Abroad Network</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'students' && styles.tabActive]}
          onPress={() => setActiveTab('students')}
        >
          <Text style={[styles.tabText, activeTab === 'students' && styles.tabTextActive]}>Students</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'calendar' && styles.tabActive]}
          onPress={() => setActiveTab('calendar')}
        >
          <Text style={[styles.tabText, activeTab === 'calendar' && styles.tabTextActive]}>Expos & Events</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#EFB748" />
          </View>
        ) : activeTab === 'students' ? (
          <FlatList
            data={students}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.studentName}>{item.name}</Text>
                  <Text style={styles.studentStatus}>{item.status}</Text>
                </View>
                <Text style={styles.studentSub}>Target Country: {item.country}</Text>
              </View>
            )}
          />
        ) : (
          <View style={styles.center}>
            <Text style={styles.placeholderText}>📅 Upcoming Dhaka Expo 2026</Text>
            <Text style={styles.placeholderSub}>QR Code attendance verification scanner ready.</Text>
            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>Open QR Scanner</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080B14', // Dark Navy Brand
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1E2220',
    backgroundColor: '#0F1110',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#EFB748', // Gold Brand Accent
    fontFamily: 'System',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#9A9EA8',
    marginTop: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#161918',
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#1E2220',
  },
  tabText: {
    color: '#9A9EA8',
    fontWeight: '600',
    fontSize: 14,
  },
  tabTextActive: {
    color: '#EFB748',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#1E2220',
    borderWidth: 1,
    borderColor: '#3F434C',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'between',
    alignItems: 'center',
  },
  studentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F0EDE6',
    flex: 1,
  },
  studentStatus: {
    fontSize: 10,
    color: '#EFB748',
    fontWeight: 'bold',
    backgroundColor: 'rgba(239,183,72,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
  },
  studentSub: {
    fontSize: 12,
    color: '#9A9EA8',
    marginTop: 8,
  },
  placeholderText: {
    color: '#F0EDE6',
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholderSub: {
    color: '#9A9EA8',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
    paddingHorizontal: 40,
  },
  button: {
    backgroundColor: '#EFB748',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#080B14',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
