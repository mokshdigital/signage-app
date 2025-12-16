'use client';

import { useState } from 'react';
import {
    Button,
    Input,
    Select,
    Textarea,
    Modal,
    Card,
    Badge,
    getStatusVariant,
    LoadingSpinner,
    Skeleton,
    EmptyState,
    ErrorState,
    Alert,
    Avatar,
    AvatarGroup,
    ConfirmDialog,
    PlusIcon,
    SearchIcon,
} from '@/components/ui';
import { DataTable, Column } from '@/components/tables';

// Sample data for testing
interface SampleItem {
    id: string;
    name: string;
    email: string;
    status: string;
    created_at: string;
}

const sampleData: SampleItem[] = [
    { id: '1', name: 'John Doe', email: 'john@example.com', status: 'available', created_at: '2024-12-01' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', status: 'in-use', created_at: '2024-12-05' },
    { id: '3', name: 'Bob Wilson', email: 'bob@example.com', status: 'maintenance', created_at: '2024-12-10' },
];

export default function ComponentsDemoPage() {
    const [showModal, setShowModal] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [selectValue, setSelectValue] = useState('');
    const [textareaValue, setTextareaValue] = useState('');
    const [showAlert, setShowAlert] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    const columns: Column<SampleItem>[] = [
        { key: 'name', header: 'Name', sortable: true },
        { key: 'email', header: 'Email', sortable: true },
        {
            key: 'status',
            header: 'Status',
            render: (item) => (
                <Badge variant={getStatusVariant(item.status)}>
                    {item.status}
                </Badge>
            ),
        },
        {
            key: 'actions',
            header: 'Actions',
            render: () => (
                <Button size="sm" variant="ghost">Edit</Button>
            ),
        },
    ];

    return (
        <div className="min-h-screen bg-gray-100 py-8">
            <div className="max-w-6xl mx-auto px-4 space-y-8">
                <h1 className="text-3xl font-bold text-gray-900">Component Library Demo</h1>

                {/* Buttons Section */}
                <Card title="Buttons" subtitle="Various button styles and states">
                    <div className="space-y-4">
                        <div className="flex flex-wrap gap-3">
                            <Button variant="primary">Primary</Button>
                            <Button variant="secondary">Secondary</Button>
                            <Button variant="danger">Danger</Button>
                            <Button variant="ghost">Ghost</Button>
                            <Button variant="success">Success</Button>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Button size="sm">Small</Button>
                            <Button size="md">Medium</Button>
                            <Button size="lg">Large</Button>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Button loading>Loading</Button>
                            <Button disabled>Disabled</Button>
                            <Button leftIcon={<PlusIcon />}>With Icon</Button>
                        </div>
                    </div>
                </Card>

                {/* Form Elements Section */}
                <Card title="Form Elements" subtitle="Input, Select, and Textarea components">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                            label="Text Input"
                            placeholder="Enter your name..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                        />
                        <Input
                            label="Input with Error"
                            error="This field is required"
                            placeholder="Has an error..."
                        />
                        <Input
                            label="Password"
                            type="password"
                            placeholder="Enter password..."
                        />
                        <Input
                            label="With Icon"
                            leftIcon={<SearchIcon />}
                            placeholder="Search..."
                        />
                        <Select
                            label="Select Option"
                            options={[
                                { value: 'available', label: 'Available' },
                                { value: 'in-use', label: 'In Use' },
                                { value: 'maintenance', label: 'Maintenance' },
                            ]}
                            value={selectValue}
                            onChange={(e) => setSelectValue(e.target.value)}
                        />
                        <Select
                            label="Select with Error"
                            error="Please select an option"
                            options={[
                                { value: 'opt1', label: 'Option 1' },
                                { value: 'opt2', label: 'Option 2' },
                            ]}
                        />
                    </div>
                    <div className="mt-6">
                        <Textarea
                            label="Description"
                            placeholder="Enter a description..."
                            value={textareaValue}
                            onChange={(e) => setTextareaValue(e.target.value)}
                            helperText="Maximum 500 characters"
                        />
                    </div>
                </Card>

                {/* Badges Section */}
                <Card title="Badges" subtitle="Status indicators and labels">
                    <div className="flex flex-wrap gap-3">
                        <Badge variant="default">Default</Badge>
                        <Badge variant="success">Success</Badge>
                        <Badge variant="warning">Warning</Badge>
                        <Badge variant="danger">Danger</Badge>
                        <Badge variant="info">Info</Badge>
                        <Badge variant="purple">Purple</Badge>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-4">
                        <Badge size="sm">Small</Badge>
                        <Badge size="md">Medium</Badge>
                        <Badge size="lg">Large</Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-4">
                        <span className="text-sm text-gray-600">Dot indicators:</span>
                        <Badge variant="success" dot />
                        <Badge variant="warning" dot />
                        <Badge variant="danger" dot pulse />
                    </div>
                </Card>

                {/* Avatar Section */}
                <Card title="Avatars" subtitle="User avatars with fallbacks and status">
                    <div className="flex items-center gap-4">
                        <Avatar fallback="JD" size="xs" />
                        <Avatar fallback="JS" size="sm" />
                        <Avatar fallback="BW" size="md" status="online" />
                        <Avatar fallback="TL" size="lg" status="away" />
                        <Avatar fallback="AB" size="xl" status="busy" />
                    </div>
                    <div className="mt-4">
                        <p className="text-sm text-gray-600 mb-2">Avatar Group:</p>
                        <AvatarGroup max={3}>
                            <Avatar fallback="A" />
                            <Avatar fallback="B" />
                            <Avatar fallback="C" />
                            <Avatar fallback="D" />
                            <Avatar fallback="E" />
                        </AvatarGroup>
                    </div>
                </Card>

                {/* Alerts Section */}
                <Card title="Alerts" subtitle="Inline notification messages">
                    <div className="space-y-3">
                        <Alert variant="info" title="Information">
                            This is an informational message.
                        </Alert>
                        <Alert variant="success" title="Success">
                            Your changes have been saved successfully!
                        </Alert>
                        <Alert variant="warning" title="Warning">
                            Please review your input before continuing.
                        </Alert>
                        {showAlert && (
                            <Alert variant="error" title="Error" dismissible onDismiss={() => setShowAlert(false)}>
                                Something went wrong. Click X to dismiss this alert.
                            </Alert>
                        )}
                    </div>
                </Card>

                {/* Loading States Section */}
                <Card title="Loading States" subtitle="Spinners and skeletons">
                    <div className="flex items-center gap-8">
                        <LoadingSpinner size="sm" centered={false} />
                        <LoadingSpinner size="md" centered={false} />
                        <LoadingSpinner size="lg" centered={false} />
                    </div>
                    <div className="mt-6">
                        <p className="text-sm text-gray-600 mb-2">Skeleton loading:</p>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                            <Skeleton className="h-4 w-5/6" />
                        </div>
                    </div>
                </Card>

                {/* Empty States Section */}
                <Card title="Empty States" subtitle="When there's no data">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="border rounded-lg">
                            <EmptyState
                                icon="📋"
                                title="No items found"
                                description="Get started by adding your first item"
                                compact
                            />
                        </div>
                        <div className="border rounded-lg">
                            <ErrorState
                                title="Failed to load"
                                description="Please try again later"
                                onRetry={() => alert('Retry clicked!')}
                            />
                        </div>
                    </div>
                </Card>

                {/* Data Table Section */}
                <Card title="Data Table" subtitle="Sortable data table with custom rendering" noPadding>
                    <DataTable
                        data={sampleData}
                        columns={columns}
                        keyExtractor={(item) => item.id}
                        onRowClick={(item) => alert(`Clicked: ${item.name}`)}
                    />
                </Card>

                {/* Modal & Dialog Section */}
                <Card title="Modals & Dialogs" subtitle="Popup windows and confirmations">
                    <div className="flex gap-3">
                        <Button onClick={() => setShowModal(true)}>
                            Open Modal
                        </Button>
                        <Button variant="danger" onClick={() => setShowConfirm(true)}>
                            Open Confirm Dialog
                        </Button>
                    </div>
                </Card>

                {/* Modal */}
                <Modal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    title="Example Modal"
                    size="md"
                >
                    <div className="space-y-4">
                        <p className="text-gray-600">
                            This is an example modal dialog. You can put any content here.
                        </p>
                        <Input label="Name" placeholder="Enter your name..." />
                        <Textarea label="Message" placeholder="Enter your message..." />
                    </div>
                </Modal>

                {/* Confirm Dialog */}
                <ConfirmDialog
                    isOpen={showConfirm}
                    title="Delete Item"
                    message="Are you sure you want to delete this item? This action cannot be undone."
                    variant="danger"
                    confirmLabel="Delete"
                    onConfirm={() => {
                        alert('Deleted!');
                        setShowConfirm(false);
                    }}
                    onCancel={() => setShowConfirm(false)}
                />
            </div>
        </div>
    );
}
