import { useEffect, useState } from 'react';
import { useAccountStore } from '../store/accountStore';
import StackCard from './StackCard';
import { Layers } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Stack } from '../types';

interface StackListProps {
  accountId: string;
}

interface SortableStackItemProps {
  stack: Stack;
  isDraggingAny: boolean;
  priorityLabel: string;
}

function SortableStackItem({ stack, isDraggingAny, priorityLabel }: SortableStackItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stack.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDraggingAny ? 'grabbing' : 'grab',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <StackCard stack={stack} isDragging={isDragging} priorityLabel={priorityLabel} />
    </div>
  );
}

export default function StackList({ accountId }: StackListProps) {
  const { stacks, fetchStacks, updateStackPriorities } = useAccountStore();
  const accountStacks = stacks[accountId] || [];
  const [sortedStacks, setSortedStacks] = useState<Stack[]>([]);
  const [isDraggingAny, setIsDraggingAny] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchStacks(accountId);
  }, [accountId, fetchStacks]);

  useEffect(() => {
    setSortedStacks([...accountStacks].sort((a, b) => a.priority - b.priority));
  }, [accountStacks]);

  const handleDragStart = () => {
    setIsDraggingAny(true);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setIsDraggingAny(false);
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sortedStacks.findIndex((s) => s.id === active.id);
      const newIndex = sortedStacks.findIndex((s) => s.id === over.id);

      const newOrder = arrayMove(sortedStacks, oldIndex, newIndex);
      setSortedStacks(newOrder);

      // Update priorities in backend
      const priorityUpdates = newOrder.map((stack, index) => ({
        id: stack.id,
        priority: index + 1,
      }));

      await updateStackPriorities(accountId, priorityUpdates);
    }
  };

  if (accountStacks.length === 0) {
    return (
      <div className="card text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
          <Layers className="w-8 h-8 text-gray-400 dark:text-gray-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No stacks yet</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Create your first stack to organize your money
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stack Grid with Drag and Drop */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={sortedStacks.map((s) => s.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedStacks.map((stack, index) => {
              const priority = index + 1;
              let priorityLabel: string;

              if (priority === 1) {
                priorityLabel = '1st Priority';
              } else if (priority === 2) {
                priorityLabel = '2nd Priority';
              } else if (priority === 3) {
                priorityLabel = '3rd Priority';
              } else {
                priorityLabel = `${priority}th Priority`;
              }

              return (
                <SortableStackItem
                  key={stack.id}
                  stack={stack}
                  isDraggingAny={isDraggingAny}
                  priorityLabel={priorityLabel}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
