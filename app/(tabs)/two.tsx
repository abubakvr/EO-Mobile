import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

// Task data - matching the image description
const tasks = [
  {
    id: '123-454-YT-1234',
    name: 'Baobab Tree',
    dueDate: '21st Sept 2025',
    assignedTo: 'Ali Nuhu',
    phone: '0900000000',
    actionType: 'validate', // 'validate' or 'growthCheck'
  },
  {
    id: '123-454-YT-1235',
    name: 'Mango Tree',
    dueDate: '22nd Sept 2025',
    assignedTo: 'John Doe',
    phone: '0900000001',
    actionType: 'validate',
  },
  {
    id: '123-454-YT-1236',
    name: 'Palm Tree',
    dueDate: '23rd Sept 2025',
    assignedTo: 'Jane Smith',
    phone: '0900000002',
    actionType: 'validate',
  },
  {
    id: '123-454-YT-1237',
    name: 'Oak Tree',
    dueDate: '24th Sept 2025',
    assignedTo: 'Mike Johnson',
    phone: '0900000003',
    actionType: 'growthCheck',
  },
  {
    id: '123-454-YT-1238',
    name: 'Pine Tree',
    dueDate: '25th Sept 2025',
    assignedTo: 'Sarah Williams',
    phone: '0900000004',
    actionType: 'growthCheck',
  },
];

export default function ScheduleScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />
      
      {/* Status Bar Area */}
      <View style={styles.statusBar}>
        <Text style={styles.statusTime}>9:41</Text>
        <View style={styles.statusIcons}>
          <Ionicons name="cellular" size={18} color="#000" />
          <Ionicons name="wifi" size={18} color="#000" style={styles.statusIcon} />
          <Ionicons name="battery-full" size={18} color="#000" style={styles.statusIcon} />
        </View>
      </View>

      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Task List</Text>
          <Text style={styles.breadcrumb}>Home/Tasks</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="notifications-outline" size={24} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Task Cards */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {tasks.map((task, index) => (
          <View key={index} style={styles.taskCard}>
            <View style={styles.taskCardContent}>
              <View style={styles.taskHeader}>
                <Text style={styles.taskId}>{task.id}</Text>
                <Text style={styles.taskName}>{task.name}</Text>
              </View>
              
              <Text style={styles.dueDate}>Due Date: {task.dueDate}</Text>
              
              <View style={styles.taskInfo}>
                <View style={styles.infoRow}>
                  <Ionicons name="person-outline" size={16} color="#666" />
                  <Text style={styles.infoText}>{task.assignedTo}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="call-outline" size={16} color="#666" />
                  <Text style={styles.infoText}>{task.phone}</Text>
                </View>
              </View>
            </View>
            
            <TouchableOpacity
              style={[
                styles.actionButton,
                task.actionType === 'validate' ? styles.validateButton : styles.growthCheckButton,
              ]}
              onPress={() => {
                if (task.actionType === 'validate') {
                  router.push('/validate');
                } else {
                  router.push('/growthcheck');
                }
              }}>
              <Text
                style={[
                  styles.actionButtonText,
                  task.actionType === 'validate'
                    ? styles.validateButtonText
                    : styles.growthCheckButtonText,
                ]}>
                {task.actionType === 'validate' ? 'Validate' : 'Growth Check'}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 0 : 8,
    paddingBottom: 8,
    backgroundColor: '#F5F5F5',
  },
  statusTime: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  statusIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    marginLeft: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: '#F5F5F5',
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  breadcrumb: {
    fontSize: 14,
    color: '#666',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconButton: {
    padding: 4,
  },
  signOutText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120, // Space for bottom navigation
  },
  taskCard: {
    backgroundColor: '#E8EDE9', // Light green-grey
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  taskCardContent: {
    flex: 1,
    marginRight: 12,
  },
  taskHeader: {
    marginBottom: 8,
  },
  taskId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  taskName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  dueDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  taskInfo: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
  },
  actionButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  validateButton: {
    backgroundColor: '#2E8B57',
  },
  growthCheckButton: {
    backgroundColor: '#FF9800',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  validateButtonText: {
    color: '#FFFFFF',
  },
  growthCheckButtonText: {
    color: '#FFFFFF',
  },
});
