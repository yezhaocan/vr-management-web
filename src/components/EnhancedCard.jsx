import React, { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ImageOff } from 'lucide-react';

/**
 * EnhancedCard Component
 * 
 * A card component with enhanced overflow handling, visual styling, and responsive layout.
 * Optimized for displaying scenic spots with images and content.
 */
export function EnhancedCard({ 
  title, 
  description, 
  children, 
  footer, 
  imageSrc,
  className,
  contentClassName,
  ...props 
}) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  return (
    <>
      <Card 
        className={cn(
          "flex flex-col sm:flex-row overflow-hidden transition-all duration-300 ease-in-out group",
          // Shadow requirement: x=0, y=2px, blur=8px, color=rgba(0,0,0,0.1)
          "shadow-[0_2px_8px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)]",
          "hover:border-[#1890ff] dark:hover:border-[#1890ff]", // 边框高亮
          "bg-white dark:bg-card border-border", // 使用系统颜色变量
          className
        )}
        {...props}
      >
        {/* Left Image Section */}
        {imageSrc && (
          <div className="flex-none p-4 sm:pr-0 flex items-center justify-center sm:justify-start">
            <div className="w-[160px] h-[160px] rounded-lg overflow-hidden flex-shrink-0 bg-muted relative border border-border">
              {!imageError ? (
                <>
                  {imageLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted animate-pulse">
                      <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                    </div>
                  )}
                  <img 
                    src={imageSrc} 
                    alt={title || "Card Image"} 
                    className={cn(
                      "w-full h-full object-cover transition-transform duration-500 group-hover:scale-105",
                      imageLoading ? "opacity-0" : "opacity-100"
                    )}
                    onLoad={() => setImageLoading(false)}
                    onError={() => {
                      setImageLoading(false);
                      setImageError(true);
                    }}
                  />
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-muted text-muted-foreground">
                  <ImageOff className="h-8 w-8 mb-2 opacity-50" />
                  <span className="text-xs">加载失败</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Right Content Section */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          {/* Header & Content */}
          <div className="flex-1 p-4 sm:p-6 pb-16 sm:pb-6 flex flex-col gap-2">
            <div className="pr-12">
              {title && <h3 className="text-lg font-semibold text-foreground tracking-tight mb-1 truncate">{title}</h3>}
              {description && <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>}
            </div>
            
            {/* Main Content */}
            <div className={cn("text-sm text-foreground mt-auto", contentClassName)}>
              {children}
            </div>
          </div>

          {/* Footer / Actions - Fixed Top Right for Desktop, Bottom for Mobile */}
          {footer && (
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex gap-2 z-10">
              {footer}
            </div>
          )}
        </div>
      </Card>
    </>
  );
}
