'use client';

import Image from 'next/image';
import { Button } from '@/app/components/ui/button';
import { Edit, Trash2, Package, MoreHorizontal } from 'lucide-react';
import { truncateText } from '@/app/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/app/components/ui/dropdown-menu';

const ProductListItem = ({ product, onEdit, onDelete }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300 flex items-center p-4 space-x-4 relative">
      <div className="relative h-24 w-24 flex-shrink-0" onClick={() => onEdit(product)}>
        <Image src={product.imageUrl} alt={product.name} layout="fill" objectFit="contain" />
      </div>
      <div className="flex-grow" onClick={() => onEdit(product)}>
        <div>
            <h3 className="text-lg font-bold text-gray-800">{product.name}</h3>
            <p className="text-sm text-gray-500">{product.brandName}</p>
            <p className="text-sm text-gray-500">{truncateText(product.description)}</p>
            <p className="text-lg font-semibold text-indigo-600 mt-2">AED {product.price.toFixed(2)}</p>
            <div className="flex items-center text-sm text-gray-600 mt-1">
                <Package className="h-4 w-4 mr-1" />
                <span>
                    {product.stock_quantity > 0 ? `Stock: ${product.stock_quantity}` : 'Out of Stock'}
                </span>
            </div>
        </div>
      </div>
      <div className="absolute top-4 right-4">
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(product); }}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(product.id); }}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default ProductListItem;
