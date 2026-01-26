import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { HeroSection } from '../HeroSection';
import { BrandHero } from '@/types/brand';

// Mock the video upload dialog
vi.mock('@/components/ui/video-upload-dialog', () => ({
  VideoUploadDialog: ({ open, onVideoReady, file }: any) => (
    open ? (
      <div data-testid="video-upload-dialog">
        <span data-testid="pending-file-name">{file?.name}</span>
        <button 
          data-testid="confirm-upload"
          onClick={() => onVideoReady('data:video/webm;base64,test')}
        >
          Confirm
        </button>
      </div>
    ) : null
  ),
}));

// Mock BackgroundImage component - filter out non-DOM props
vi.mock('@/components/ui/optimized-image', () => ({
  BackgroundImage: ({ children, videoSrc, preferVideo, fallbackSrc, priority, parallax, parallaxOffset, ...props }: any) => (
    <div data-testid="background-image" {...props}>
      {children}
    </div>
  ),
}));

// Helper to wrap components with TooltipProvider
const renderWithProviders = (ui: React.ReactElement) => {
  return render(<TooltipProvider>{ui}</TooltipProvider>);
};

describe('HeroSection Video Upload', () => {
  const mockHero: BrandHero = {
    name: 'Test Brand',
    tagline: 'Test Tagline',
    coverImage: '',
    logoUrl: '',
    useVideo: true,
  };

  const mockOnHeroChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('accepts .mov files for video upload', async () => {
    renderWithProviders(
      <HeroSection 
        hero={mockHero} 
        onHeroChange={mockOnHeroChange}
      />
    );

    // Find the video input by test id
    const videoInput = screen.getByTestId('video-file-input') as HTMLInputElement;
    expect(videoInput).toBeTruthy();
    
    // Check that the accept attribute includes .mov
    expect(videoInput.accept).toContain('.mov');
    expect(videoInput.accept).toContain('video/*');

    // Create a mock .mov file
    const movFile = new File(['video content'], 'test-video.mov', { 
      type: 'video/quicktime' 
    });

    // Simulate file selection
    fireEvent.change(videoInput, { target: { files: [movFile] } });

    // Wait for the video upload dialog to appear
    await waitFor(() => {
      expect(screen.getByTestId('video-upload-dialog')).toBeInTheDocument();
    });

    // Verify the file name is passed to the dialog
    expect(screen.getByTestId('pending-file-name')).toHaveTextContent('test-video.mov');
  });

  it('accepts .mp4 files for video upload', async () => {
    renderWithProviders(
      <HeroSection 
        hero={mockHero} 
        onHeroChange={mockOnHeroChange}
      />
    );

    const videoInput = screen.getByTestId('video-file-input') as HTMLInputElement;
    
    const mp4File = new File(['video content'], 'test-video.mp4', { 
      type: 'video/mp4' 
    });

    fireEvent.change(videoInput, { target: { files: [mp4File] } });

    await waitFor(() => {
      expect(screen.getByTestId('video-upload-dialog')).toBeInTheDocument();
    });

    expect(screen.getByTestId('pending-file-name')).toHaveTextContent('test-video.mp4');
  });

  it('accepts .webm files for video upload', async () => {
    renderWithProviders(
      <HeroSection 
        hero={mockHero} 
        onHeroChange={mockOnHeroChange}
      />
    );

    const videoInput = screen.getByTestId('video-file-input') as HTMLInputElement;
    
    const webmFile = new File(['video content'], 'test-video.webm', { 
      type: 'video/webm' 
    });

    fireEvent.change(videoInput, { target: { files: [webmFile] } });

    await waitFor(() => {
      expect(screen.getByTestId('video-upload-dialog')).toBeInTheDocument();
    });

    expect(screen.getByTestId('pending-file-name')).toHaveTextContent('test-video.webm');
  });

  it('calls onHeroChange with video data after compression dialog confirms', async () => {
    renderWithProviders(
      <HeroSection 
        hero={mockHero} 
        onHeroChange={mockOnHeroChange}
      />
    );

    const videoInput = screen.getByTestId('video-file-input') as HTMLInputElement;
    
    const movFile = new File(['video content'], 'test-video.mov', { 
      type: 'video/quicktime' 
    });

    fireEvent.change(videoInput, { target: { files: [movFile] } });

    await waitFor(() => {
      expect(screen.getByTestId('video-upload-dialog')).toBeInTheDocument();
    });

    // Click confirm button in the dialog
    const confirmButton = screen.getByTestId('confirm-upload');
    fireEvent.click(confirmButton);

    // Verify onHeroChange was called with the video data
    await waitFor(() => {
      expect(mockOnHeroChange).toHaveBeenCalledWith(
        expect.objectContaining({
          coverVideo: 'data:video/webm;base64,test',
          useVideo: true,
        })
      );
    });
  });

  it('rejects non-video files with an alert', async () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});

    renderWithProviders(
      <HeroSection 
        hero={mockHero} 
        onHeroChange={mockOnHeroChange}
      />
    );

    const videoInput = screen.getByTestId('video-file-input') as HTMLInputElement;
    
    // Try to upload a non-video file
    const pdfFile = new File(['pdf content'], 'document.pdf', { 
      type: 'application/pdf' 
    });

    fireEvent.change(videoInput, { target: { files: [pdfFile] } });

    // Should show an alert
    await waitFor(() => {
      expect(alertMock).toHaveBeenCalled();
    });

    // Dialog should not open
    expect(screen.queryByTestId('video-upload-dialog')).not.toBeInTheDocument();

    alertMock.mockRestore();
  });

  it('accepts uppercase .MOV extension files', async () => {
    renderWithProviders(
      <HeroSection 
        hero={mockHero} 
        onHeroChange={mockOnHeroChange}
      />
    );

    const videoInput = screen.getByTestId('video-file-input') as HTMLInputElement;
    
    // File with uppercase extension (common on macOS)
    const movFile = new File(['video content'], 'TEST-VIDEO.MOV', { 
      type: '' // Some browsers don't set MIME type for .MOV
    });

    fireEvent.change(videoInput, { target: { files: [movFile] } });

    await waitFor(() => {
      expect(screen.getByTestId('video-upload-dialog')).toBeInTheDocument();
    });

    expect(screen.getByTestId('pending-file-name')).toHaveTextContent('TEST-VIDEO.MOV');
  });
});
