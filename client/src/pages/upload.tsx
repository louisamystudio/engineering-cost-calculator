import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Upload as UploadIcon, FileSpreadsheet, Eye } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface SpreadsheetFile {
  id: string;
  filename: string;
  originalName: string;
  uploadedAt: string;
}

interface Sheet {
  id: string;
  fileId: string;
  sheetName: string;
  headers: string[];
  rowCount: number;
}

interface SheetData {
  id: string;
  sheetId: string;
  rowIndex: number;
  data: Record<string, any>;
}

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileData, setSelectedFileData] = useState<{file: SpreadsheetFile, sheets: Sheet[]} | null>(null);
  const [selectedSheetData, setSelectedSheetData] = useState<SheetData[] | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all spreadsheet files
  const { data: files = [], isLoading: filesLoading } = useQuery({
    queryKey: ["/api/spreadsheets"],
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/upload-excel", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Upload failed");
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Upload Successful",
        description: `Processed ${data.sheets} sheets with ${data.totalRows} total rows`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/spreadsheets"] });
      setSelectedFile(null);
    },
    onError: (error) => {
      toast({
        title: "Upload Failed", 
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // View file details mutation
  const viewFileMutation = useMutation({
    mutationFn: async (fileId: string) => {
      const response = await fetch(`/api/spreadsheets/${fileId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch file details");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setSelectedFileData(data);
      setSelectedSheetData(null);
    },
  });

  // View sheet data mutation  
  const viewSheetMutation = useMutation({
    mutationFn: async (sheetId: string) => {
      const response = await fetch(`/api/sheets/${sheetId}/data`);
      if (!response.ok) {
        throw new Error("Failed to fetch sheet data");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setSelectedSheetData(data);
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <FileSpreadsheet className="h-8 w-8" />
        <h1 className="text-3xl font-bold">Excel File Upload</h1>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UploadIcon className="h-5 w-5" />
            Upload Excel File
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="excel-file">Choose Excel File</Label>
            <Input
              id="excel-file"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="mt-1"
            />
          </div>
          
          {selectedFile && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </span>
              <Button 
                onClick={handleUpload} 
                disabled={uploadMutation.isPending}
                className="flex items-center gap-2"
              >
                {uploadMutation.isPending ? "Uploading..." : "Upload"}
              </Button>
            </div>
          )}

          {uploadMutation.isPending && (
            <div className="space-y-2">
              <Progress value={50} className="w-full" />
              <p className="text-sm text-gray-600">Processing Excel file...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Files List */}
      <Card>
        <CardHeader>
          <CardTitle>Uploaded Files</CardTitle>
        </CardHeader>
        <CardContent>
          {filesLoading ? (
            <p>Loading files...</p>
          ) : (files as SpreadsheetFile[]).length === 0 ? (
            <p className="text-gray-600">No files uploaded yet</p>
          ) : (
            <div className="space-y-2">
              {(files as SpreadsheetFile[]).map((file: SpreadsheetFile) => (
                <div key={file.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">{file.originalName}</p>
                    <p className="text-sm text-gray-600">
                      Uploaded: {new Date(file.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => viewFileMutation.mutate(file.id)}
                    disabled={viewFileMutation.isPending}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* File Details */}
      {selectedFileData && (
        <Card>
          <CardHeader>
            <CardTitle>File Details: {selectedFileData.file.originalName}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                This file contains {selectedFileData.sheets.length} sheet(s)
              </p>
              
              <div className="grid gap-2">
                {selectedFileData.sheets.map((sheet) => (
                  <div key={sheet.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">{sheet.sheetName}</p>
                      <p className="text-sm text-gray-600">{sheet.rowCount} rows</p>
                      {sheet.headers && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {sheet.headers.slice(0, 5).map((header, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {header}
                            </Badge>
                          ))}
                          {sheet.headers.length > 5 && (
                            <Badge variant="secondary" className="text-xs">
                              +{sheet.headers.length - 5} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => viewSheetMutation.mutate(sheet.id)}
                      disabled={viewSheetMutation.isPending}
                    >
                      View Data
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sheet Data */}
      {selectedSheetData && selectedSheetData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sheet Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Row</TableHead>
                    {Object.keys(selectedSheetData[0].data).map((header) => (
                      <TableHead key={header}>{header}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedSheetData.slice(0, 10).map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.rowIndex + 1}</TableCell>
                      {Object.values(row.data).map((value, idx) => (
                        <TableCell key={idx}>
                          {value?.toString() || ""}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {selectedSheetData.length > 10 && (
                <p className="text-sm text-gray-600 mt-2">
                  Showing first 10 rows of {selectedSheetData.length} total rows
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}