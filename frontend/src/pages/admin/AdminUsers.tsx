import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { adminApi, type AdminUser } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import io from 'socket.io-client';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { adminUserSchema, type AdminUserFormValues } from "@/lib/validations/auth";

// Initial form state
const initialFormState = {
  name: '',
  email: '',
  password: '',
  role: 'farmer',
  mobile: '',
  location: '',
  crops: '', // comma separated string for input
};

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const form = useForm<AdminUserFormValues>({
    resolver: zodResolver(adminUserSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'farmer',
      mobile: '',
      location: '',
      crops: '',
    },
  });

  // Delete dialog state
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getUsers(
        page,
        search,
        statusFilter === 'all' ? '' : statusFilter
      );
      setUsers(data.users);
      setTotalPages(data.pages);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, search, statusFilter]);

  // Socket.io for Real-time updates
  useEffect(() => {
    const socket = io('http://localhost:5000');

    socket.on('user_added', (newUser: AdminUser) => {
      setUsers(prev => [newUser, ...prev]);
      toast.success(`New user added: ${newUser.name}`);
    });

    socket.on('user_updated', (updatedUser: AdminUser) => {
      setUsers(prev => prev.map(u => u._id === updatedUser._id ? updatedUser : u));
    });

    socket.on('user_removed', ({ id }: { id: string }) => {
      setUsers(prev => prev.filter(u => u._id !== id));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Handlers
  const handleOpenAdd = () => {
    setEditingId(null);
    form.reset({
      name: '',
      email: '',
      password: '',
      role: 'farmer',
      mobile: '',
      location: '',
      crops: '',
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (user: AdminUser) => {
    setEditingId(user._id);
    form.reset({
      name: user.name,
      email: user.email || '',
      password: '', // Don't show password
      role: user.role as "farmer" | "admin",
      mobile: user.mobile || '',
      location: user.location || '',
      crops: user.crops?.join(', ') || '',
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (values: AdminUserFormValues) => {
    setFormLoading(true);

    try {
      const payload = {
        ...values,
        crops: values.crops ? values.crops.split(',').map(c => c.trim()).filter(Boolean) : [],
      };

      if (editingId) {
        await adminApi.updateUser(editingId, payload);
        toast.success('User updated successfully');
      } else {
        await adminApi.createUser(payload);
        toast.success('User created successfully');
      }
      setIsDialogOpen(false);
      fetchUsers(); // Refresh list to be sure
    } catch (error: any) {
      console.error('Admin User Operation Failed:', error);
      toast.error(error.response?.data?.message || error.message || 'Operation failed');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await adminApi.deleteUser(deleteId);
      toast.success('User deleted successfully');
      setDeleteId(null);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Delete failed');
    }
  };

  const handleStatusChange = async (userId: string, newStatus: 'active' | 'suspended') => {
    try {
      await adminApi.updateUserStatus(userId, newStatus);
      // Optimistic update
      setUsers(users.map(u => u._id === userId ? { ...u, status: newStatus } : u));
      toast.success(`User ${newStatus === 'active' ? 'activated' : 'suspended'}`);
    } catch (error: any) {
      toast.error('Failed to update status');
      fetchUsers(); // Revert on error
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold font-display">User Management</h1>
          
          <div className="flex flex-col sm:flex-row gap-3">
             <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                 <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={handleOpenAdd}>
              <Plus className="mr-2 h-4 w-4" /> Add User
            </Button>
          </div>
        </div>

        <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Crops</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.location || '-'}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {user.crops?.join(', ') || '-'}
                    </TableCell>
                     <TableCell>
                      <Badge variant={user.status === 'active' ? 'outline' : 'destructive'} 
                             className={user.status === 'active' ? 'text-green-600 border-green-600' : ''}>
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {user.status === 'active' ? (
                          <Button size="icon" variant="ghost" title="Suspend" onClick={() => handleStatusChange(user._id, 'suspended')}>
                            <X className="h-4 w-4 text-orange-500" />
                          </Button>
                        ) : (
                          <Button size="icon" variant="ghost" title="Activate" onClick={() => handleStatusChange(user._id, 'active')}>
                            <Check className="h-4 w-4 text-green-500" />
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" title="Edit" onClick={() => handleOpenEdit(user)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" title="Delete" onClick={() => setDeleteId(user._id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="py-1 px-3 text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>

        {/* Create/Edit User Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <DialogHeader>
                  <DialogTitle>{editingId ? 'Edit User' : 'Add User'}</DialogTitle>
                  <DialogDescription>
                    {editingId ? 'Update user details below.' : 'Add a new user to the system.'}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
                  
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem className="grid gap-1 relative pb-4">
                      <FormLabel>Name</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <div className="absolute -bottom-1 left-0"><FormMessage className="text-[11px]" /></div>
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem className="grid gap-1 relative pb-4">
                      <FormLabel>Email</FormLabel>
                      <FormControl><Input type="email" {...field} /></FormControl>
                      <div className="absolute -bottom-1 left-0"><FormMessage className="text-[11px]" /></div>
                    </FormItem>
                  )} />

                  {!editingId && (
                    <FormField control={form.control} name="password" render={({ field }) => (
                      <FormItem className="grid gap-1 relative pb-4">
                        <FormLabel>Password</FormLabel>
                        <FormControl><Input type="password" placeholder="Min 6 chars" {...field} /></FormControl>
                        <div className="absolute -bottom-1 left-0"><FormMessage className="text-[11px]" /></div>
                      </FormItem>
                    )} />
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="role" render={({ field }) => (
                      <FormItem className="grid gap-1 relative pb-4">
                        <FormLabel>Role</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="farmer">Farmer</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="absolute -bottom-1 left-0"><FormMessage className="text-[11px]" /></div>
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="mobile" render={({ field }) => (
                      <FormItem className="grid gap-1 relative pb-4">
                        <FormLabel>Mobile</FormLabel>
                        <FormControl><Input maxLength={10} {...field} /></FormControl>
                        <div className="absolute -bottom-1 left-0"><FormMessage className="text-[11px]" /></div>
                      </FormItem>
                    )} />
                  </div>

                  <FormField control={form.control} name="location" render={({ field }) => (
                    <FormItem className="grid gap-1 relative pb-4">
                      <FormLabel>Location</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <div className="absolute -bottom-1 left-0"><FormMessage className="text-[11px]" /></div>
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="crops" render={({ field }) => (
                    <FormItem className="grid gap-1 relative pb-4">
                      <FormLabel>Crops (comma separated)</FormLabel>
                      <FormControl><Input placeholder="e.g. Wheat, Rice" {...field} /></FormControl>
                      <div className="absolute -bottom-1 left-0"><FormMessage className="text-[11px]" /></div>
                    </FormItem>
                  )} />

                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={formLoading}>
                    {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingId ? 'Update' : 'Create'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the user account
                and remove their data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </AppLayout>
  );
}
